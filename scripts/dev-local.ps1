$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendProcess = $null
$frontendProcess = $null

try {
    $venvPython = Join-Path $root ".venv\Scripts\python.exe"
    if (-not (Test-Path $venvPython)) {
        throw "Missing virtual environment Python at $venvPython. Run 'make install' (or 'make venv' then 'make install-backend-deps') first."
    }

    Write-Host "Starting backend services..." -ForegroundColor Cyan
    $backendProcess = Start-Process -FilePath $venvPython `
        -ArgumentList "backend/dev.py" `
        -WorkingDirectory $root `
        -PassThru

    Start-Sleep -Seconds 2

    Write-Host "Starting frontend..." -ForegroundColor Cyan
    $frontendProcess = Start-Process -FilePath "npm.cmd" `
        -ArgumentList "run", "dev" `
        -WorkingDirectory $root `
        -PassThru

    Write-Host ""
    Write-Host "SuperHero AI IDE is starting locally." -ForegroundColor Green
    Write-Host "Frontend PID: $($frontendProcess.Id)"
    Write-Host "Backend PID:  $($backendProcess.Id)"
    Write-Host "Frontend: http://localhost:3000"
    Write-Host "Gateway:  http://localhost:8000"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop both processes."

    while ($true) {
        if ($backendProcess.HasExited) {
            throw "Backend process exited with code $($backendProcess.ExitCode)."
        }

        if ($frontendProcess.HasExited) {
            throw "Frontend process exited with code $($frontendProcess.ExitCode)."
        }

        Start-Sleep -Seconds 2
    }
}
finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
    }

    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force
    }
}
