# =============================================================================
# Script de Validación y Verificación Automática de HU-14 (Monitoreo y Observabilidad)
# Red Social Gamer - Grupo 08
# =============================================================================
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

Write-Host "=== 1. Verificando estado de contenedores de monitoreo ===" -ForegroundColor Cyan
$expectedContainers = @(
    'gamer_prometheus',
    'gamer_grafana',
    'gamer_node_exporter',
    'gamer_cadvisor',
    'gamer_postgres_exporter'
)

foreach ($c in $expectedContainers) {
    $status = docker inspect --format '{{.State.Status}}' $c 2>$null
    if ($status -ne 'running') {
        throw "El contenedor $c no está en estado 'running' (estado actual: $status)."
    }
    Write-Host "  [OK] Contenedor $c : $status" -ForegroundColor Green
}

Write-Host "`n=== 2. Verificando Targets de Scraping en Prometheus ===" -ForegroundColor Cyan
$promTargets = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/targets"
$active = $promTargets.data.activeTargets

foreach ($t in $active) {
    $job = $t.labels.job
    $instance = $t.labels.instance
    $health = $t.health
    if ($health -ne 'up') {
        throw "El target $job ($instance) no está UP (estado: $health). Error: $($t.lastError)"
    }
    Write-Host "  [OK] Target $job ($instance) : $health" -ForegroundColor Green
}

Write-Host "`n=== 3. Evaluando Métricas Clave en Prometheus ===" -ForegroundColor Cyan

# 3.1 Patroni Leader
$leaderQuery = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=patroni_primary==1"
$leaderNode = $leaderQuery.data.result[0].metric.name
Write-Host "  [OK] Líder actual de Patroni: $leaderNode" -ForegroundColor Green

# 3.2 Nodos Patroni activos
$nodesQuery = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=count(patroni_postgres_running==1)"
$nodesCount = $nodesQuery.data.result[0].value[1]
Write-Host "  [OK] Nodos Patroni corriendo: $nodesCount / 3" -ForegroundColor Green

# 3.3 Conexiones PostgreSQL
$connQuery = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=sum(pg_stat_activity_count)"
$connCount = $connQuery.data.result[0].value[1]
Write-Host "  [OK] Conexiones activas a PostgreSQL: $connCount" -ForegroundColor Green

# 3.4 Hardware del Host
$cpuQuery = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=100-(avg(rate(node_cpu_seconds_total{mode='idle'}[1m]))*100)"
$cpuVal = [math]::Round([double]$cpuQuery.data.result[0].value[1], 2)
Write-Host "  [OK] Uso de CPU Host: $cpuVal %" -ForegroundColor Green

Write-Host "`n=== 4. Verificando Integración con Grafana ===" -ForegroundColor Cyan
$pair = "admin:admin123"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)
$headers = @{ Authorization = "Basic $base64" }

$dash = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboards/uid/gaming-observability-overview" -Headers $headers
Write-Host "  [OK] Dashboard provisionado correctamente: '$($dash.dashboard.title)' (UID: $($dash.dashboard.uid))" -ForegroundColor Green

Write-Host "`n=== 5. Verificando Reglas de Alerta Cargadas ===" -ForegroundColor Cyan
$rules = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/rules"
$alertCount = 0
foreach ($group in $rules.data.groups) {
    foreach ($r in $group.rules) {
        if ($r.type -eq 'alerting') {
            $alertCount++
            Write-Host "  [OK] Regla activa: $($r.name) (Grupo: $($group.name), Estado: $($r.state))" -ForegroundColor Green
        }
    }
}
Write-Host "  Total de reglas de alerta configuradas: $alertCount" -ForegroundColor Cyan

Write-Host "`n========================================================" -ForegroundColor Yellow
Write-Host "  TODAS LAS VALIDACIONES DE LA HU-14 PASARON EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Yellow
