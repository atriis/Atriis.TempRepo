<#
.SYNOPSIS
    Re-runs only the Cucumber scenarios that failed in the last test run.

.DESCRIPTION
    Reads test-results/rerun.txt (written by the Cucumber rerun formatter) and
    runs only those feature file locations again. If there are no failures the
    script exits cleanly without starting a browser.

.PARAMETER Headed
    Run browsers in headed (visible) mode. Default: headless.

.PARAMETER Parallel
    Number of parallel workers. Default: 4.

.EXAMPLE
    # Headless re-run (same as CI)
    .\scripts\rerun-failed.ps1

    # Visible browser re-run for debugging
    .\scripts\rerun-failed.ps1 -Headed

    # Single-threaded for easier debugging
    .\scripts\rerun-failed.ps1 -Headed -Parallel 1
#>
param(
    [switch]$Headed,
    [int]$Parallel = 4
)

$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."

$rerunFile = "test-results/rerun.txt"

if (-not (Test-Path $rerunFile)) {
    Write-Host "No rerun file found at '$rerunFile'. Run your tests first." -ForegroundColor Yellow
    exit 0
}

$content = (Get-Content $rerunFile -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($content)) {
    Write-Host "All scenarios passed — nothing to rerun." -ForegroundColor Green
    exit 0
}

$failureCount = ($content -split "`n" | Where-Object { $_ -match '\S' }).Count
Write-Host "Rerunning $failureCount failed scenario(s)..." -ForegroundColor Cyan

if ($Headed) {
    $env:HEADLESS = "false"
} else {
    $env:HEADLESS = "true"
}

npx cucumber-js "@$rerunFile" --config cucumber.js --parallel $Parallel

$exit = $LASTEXITCODE
if ($exit -eq 0) {
    Write-Host "All retried scenarios passed." -ForegroundColor Green
} else {
    Write-Host "Some scenarios still failing after rerun (exit $exit)." -ForegroundColor Red
}
exit $exit
