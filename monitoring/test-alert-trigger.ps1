# =============================================================================
# Prueba Controlada de Estrés y Disparo de Alertas (HU-14)
# Red Social Gamer - Grupo 08
# =============================================================================
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

Write-Host "=== Iniciando Prueba de Estrés para Validación de Alertas en Prometheus ===" -ForegroundColor Cyan

# 1. Verificar estado inicial de alertas
Write-Host "1. Comprobando que no haya alertas activas previas..." -ForegroundColor Yellow
$initialAlerts = (Invoke-RestMethod -Uri "http://localhost:9090/api/v1/alerts").data.alerts
$activeCount = @($initialAlerts).Count
Write-Host "   Alertas activas iniciales: $activeCount" -ForegroundColor Green

# 2. Generar carga intensiva de CPU mediante contenedor efímero
Write-Host "`n2. Lanzando contenedor generador de carga sintética en CPU (12 hilos)..." -ForegroundColor Yellow
$containerId = docker run -d --rm --name gamer_cpu_stress alpine sh -c 'for i in $(seq 1 12); do while true; do :; done & done; wait'

try {
    Write-Host "   Contenedor de estrés ejecutándose (ID: $($containerId.Substring(0,12)))..." -ForegroundColor Green
    Write-Host "3. Monitoreando regla 'HighCpuStressDetected' en Prometheus hasta disparo..." -ForegroundColor Yellow

    $detected = $false
    $timeoutSec = 60
    $stopwatch = [Diagnostics.Stopwatch]::StartNew()

    $q = [uri]::EscapeDataString('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[30s])) * 100)')

    while ($stopwatch.Elapsed.TotalSeconds -lt $timeoutSec) {
        Start-Sleep -Seconds 3
        
        $cpuPct = 0
        try {
            $cpuResp = (Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=$q").data.result
            if ($cpuResp -and $cpuResp.Count -gt 0) {
                $cpuPct = [math]::Round([double]$cpuResp[0].value[1], 2)
            }
        } catch { }

        # Consultar estado de alertas
        $alertsResp = (Invoke-RestMethod -Uri "http://localhost:9090/api/v1/alerts").data.alerts
        $stressAlert = $alertsResp | Where-Object { $_.labels.alertname -eq 'HighCpuStressDetected' }

        if ($stressAlert) {
            $state = $stressAlert.state
            Write-Host "   [$([math]::Round($stopwatch.Elapsed.TotalSeconds,1))s] CPU: $cpuPct% -> Alerta HighCpuStressDetected: $state" -ForegroundColor Magenta
            if ($state -eq 'firing') {
                $detected = $true
                Write-Host "`n[EXITO] ¡Alerta disparada exitosamente en estado FIRING!" -ForegroundColor Green
                Write-Host "   Detalles de la alerta:" -ForegroundColor Cyan
                Write-Host "   - Nombre: $($stressAlert.labels.alertname)"
                Write-Host "   - Severidad: $($stressAlert.labels.severity)"
                Write-Host "   - Estado: $($stressAlert.state)"
                Write-Host "   - Activa desde: $($stressAlert.activeAt)"
                Write-Host "   - Resumen: $($stressAlert.annotations.summary)"
                break
            }
        } else {
            Write-Host "   [$([math]::Round($stopwatch.Elapsed.TotalSeconds,1))s] CPU: $cpuPct% -> Alerta aún inactiva (acumulando ventana de tiempo)" -ForegroundColor DarkGray
        }
    }

    if (-not $detected) {
        throw "Tiempo de espera agotado sin alcanzar el estado 'firing'."
    }

} finally {
    Write-Host "`n4. Deteniendo contenedor generador de carga..." -ForegroundColor Yellow
    docker stop gamer_cpu_stress 2>$null | Out-Null
    Write-Host "   Contenedor de estrés detenido. Retornando a carga normal." -ForegroundColor Green
}

# 5. Verificar recuperación
Write-Host "`n5. Esperando que la alerta se resuelva tras el cese de carga..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
$finalAlerts = (Invoke-RestMethod -Uri "http://localhost:9090/api/v1/alerts").data.alerts
$stillFiring = $finalAlerts | Where-Object { $_.labels.alertname -eq 'HighCpuStressDetected' }

if (-not $stillFiring) {
    Write-Host "   [OK] La alerta se ha resuelto y ha retornado a estado INACTIVE." -ForegroundColor Green
} else {
    Write-Host "   [INFO] La alerta está en transición de resolución ($($stillFiring.state))." -ForegroundColor Yellow
}

Write-Host "`n========================================================" -ForegroundColor Yellow
Write-Host "  PRUEBA DE DETECCION DE CONDICION ANORMAL COMPLETADA   " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Yellow
