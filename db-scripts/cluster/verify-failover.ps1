# Ejecutar desde la raíz con el Compose oficial activo. Detiene brevemente
# el primario y lo vuelve a levantar. Coordinar el momento con el equipo.
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

function Invoke-Compose {
    docker compose @args
    if ($LASTEXITCODE -ne 0) { throw "Falló docker compose $($args[0])." }
}

function Get-Members([string]$Node) {
    Invoke-Compose exec -T $Node patronictl -c /etc/patroni.yml list -f json |
        ConvertFrom-Json
}

function Invoke-Sql([string]$From, [string]$HostName, [string]$Sql) {
    $command = 'PGPASSWORD="$PATRONI_SUPERUSER_PASSWORD" PGOPTIONS="-c statement_timeout=8000" psql -X -q -At -v ON_ERROR_STOP=1 -h "$1" -U "$PATRONI_SUPERUSER_USERNAME" -d "$POSTGRES_DB"'
    $Sql | docker compose exec -T $From sh -ec $command psql $HostName
    if ($LASTEXITCODE -ne 0) { throw "Falló la consulta SQL en $HostName." }
}

function Wait-For([scriptblock]$Condition, [string]$Failure, [int]$Seconds = 60) {
    $clock = [Diagnostics.Stopwatch]::StartNew()
    do {
        if (& $Condition) { return }
        Start-Sleep -Seconds 1
    } while ($clock.Elapsed.TotalSeconds -lt $Seconds)
    throw $Failure
}

function Get-ApiStatus {
    try {
        $response = Invoke-WebRequest $api -TimeoutSec 4 -SkipHttpErrorCheck
        if ($response.StatusCode -eq 200) {
            $result = $response.Content | ConvertFrom-Json
            if ($result.status -ne '1' -or @($result.data).Count -ne 10) { return 'datos inválidos' }
        }
        return [string]$response.StatusCode
    } catch {
        return 'conexión interrumpida'
    }
}

$members = @(Get-Members pg-node-1)
$leaders = @($members | Where-Object Role -EQ Leader)
$replicas = @($members | Where-Object { $_.Role -ne 'Leader' -and $_.State -eq 'streaming' })
if ($leaders.Count -ne 1 -or $replicas.Count -ne 2 -or 'Sync Standby' -notin $replicas.Role) {
    throw 'Esperar a un líder y dos secundarios en streaming, con uno síncrono.'
}

$primary = $leaders[0].Member
$survivor = $replicas[0].Member
$api = 'http://' + (Invoke-Compose port backend 3000 | Select-Object -First 1).Replace('0.0.0.0:', '127.0.0.1:') + '/juego/mas-jugados'
$web = 'http://' + (Invoke-Compose port frontend 80 | Select-Object -First 1).Replace('0.0.0.0:', '127.0.0.1:')
$backendId = Invoke-Compose ps -q backend
$backendStart = docker inspect --format '{{.State.StartedAt}}' $backendId
$table = 'hu09_evidencia_' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$created = $false
$stopped = $false

try {
    "=== HU-09 | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') | Compose oficial ==="
    Invoke-Compose exec -T $survivor patronictl -c /etc/patroni.yml list
    'etcd: estado de los tres miembros'
    Invoke-Compose exec -T etcd-1 etcdctl endpoint health --cluster
    if ((Get-ApiStatus) -ne '200') { throw 'La API debe responder antes de la prueba.' }
    "Frontend HTTP $((Invoke-WebRequest $web -TimeoutSec 5).StatusCode); API HTTP 200 (10 juegos)"
    Invoke-Sql $survivor postgres "CREATE TABLE public.$table (evento text PRIMARY KEY);"
    $created = $true
    $before = Invoke-Sql $survivor postgres "INSERT INTO public.$table VALUES ('antes_del_fallo') RETURNING evento;"
    if ($before -ne 'antes_del_fallo') { throw 'No se confirmó la escritura inicial.' }
    "Escritura por postgres:5432 | $before"
    $writtenLsn = Invoke-Sql $survivor postgres 'SELECT pg_current_wal_lsn();'

    foreach ($replica in $replicas.Member) {
        Wait-For {
            (Invoke-Sql $survivor $replica "SELECT pg_last_wal_replay_lsn() >= '$writtenLsn'::pg_lsn;") -eq 't'
        } 'La escritura no se reflejó en el secundario.'
        $proof = Invoke-Sql $survivor $replica "SELECT pg_is_in_recovery(), current_setting('transaction_read_only'), evento FROM public.$table;"
        if ($proof -ne 't|on|antes_del_fallo') { throw "Estado inesperado de $replica." }
        "$replica | en recuperación | solo lectura | registro"
        "$replica | $proof"
    }
    'pg_stat_replication | nodo | estado | modo | bytes pendientes de aplicar'
    Invoke-Sql $survivor postgres "SELECT application_name, state, sync_state, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)::bigint FROM pg_stat_replication ORDER BY application_name;"

    '=== HU-10 | Caída del primario y recuperación automática ==='
    "docker compose stop -t 0 $primary"
    $clock = [Diagnostics.Stopwatch]::StartNew()
    $stopped = $true
    Invoke-Compose stop -t 0 $primary
    $during = Get-ApiStatus
    "Primera petición tras la caída: HTTP/estado $during"
    if ($during -ne '200') {
        Wait-For { (Get-ApiStatus) -eq '200' } 'La API no se recuperó.'
    }
    "API HTTP 200 (10 juegos) tras $([math]::Round($clock.Elapsed.TotalSeconds, 1)) s desde la orden de parada."
    $newLeaders = @(Get-Members $survivor | Where-Object Role -EQ Leader)
    if ($newLeaders.Count -ne 1 -or $newLeaders[0].Member -eq $primary) {
        throw 'No se comprobó la promoción de un secundario.'
    }
    Invoke-Compose exec -T $survivor patronictl -c /etc/patroni.yml list
    $originalStatus = docker inspect --format '{{.State.Status}}' (Invoke-Compose ps -aq $primary)
    if ($originalStatus -ne 'exited') { throw 'El primario anterior debe seguir detenido.' }
    if ((docker inspect --format '{{.State.StartedAt}}' $backendId) -ne $backendStart -or (Invoke-Compose ps -q backend) -ne $backendId) {
        throw 'El backend se reinició durante la prueba.'
    }
    "Primario anterior: $originalStatus. Backend: mismo contenedor y hora de arranque."
    $preserved = Invoke-Sql $survivor postgres "SELECT evento FROM public.$table;"
    if ($preserved -ne 'antes_del_fallo') { throw 'No se conservó la escritura anterior.' }
    "Lectura por el mismo endpoint | $preserved"
    Wait-For {
        (Invoke-Sql $survivor postgres "SELECT count(*) FROM pg_stat_replication WHERE sync_state = 'sync';") -eq '1'
    } 'El nuevo primario no recuperó la réplica síncrona.'
    $after = Invoke-Sql $survivor postgres "INSERT INTO public.$table VALUES ('despues_del_fallo') RETURNING evento;"
    if ($after -ne 'despues_del_fallo') { throw 'No se confirmó la escritura en el nuevo primario.' }
    "Nueva escritura por el mismo endpoint | $after"

    '=== HU-10 | Reincorporación del primario anterior ==='
    "docker compose start $primary"
    Invoke-Compose start $primary
    $stopped = $false
    Wait-For {
        $current = @(Get-Members $survivor)
        @($current | Where-Object Role -EQ Leader).Count -eq 1 -and
        @($current | Where-Object { $_.Role -ne 'Leader' -and $_.State -eq 'streaming' }).Count -eq 2 -and
        $newLeaders[0].Member -eq ($current | Where-Object Role -EQ Leader).Member
    } 'El primario anterior no se reincorporó como réplica.' 120
    Invoke-Compose exec -T $survivor patronictl -c /etc/patroni.yml list
    $rejoined = @(Invoke-Sql $survivor $primary "SELECT pg_is_in_recovery(), evento FROM public.$table ORDER BY evento;")
    if (($rejoined -join ',') -ne 't|antes_del_fallo,t|despues_del_fallo') {
        throw 'La réplica reincorporada no contiene ambos registros.'
    }
    "$primary | en recuperación | registro"
    $rejoined
} finally {
    if ($stopped) { Invoke-Compose start $primary }
    if ($created) {
        Invoke-Sql $survivor postgres "DROP TABLE public.$table;"
        "Tabla de evidencia eliminada: $table"
    }
}
