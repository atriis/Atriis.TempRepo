<#
.SYNOPSIS
  Headless wrapper for flights orchestration — intended for CI or scheduled runs.

.DESCRIPTION
  Calls flights-orchestration.ps1 in headless mode with default settings.
  Optionally filters suppliers or skips known-flaky ones.

.PARAMETER Suppliers
  Comma-separated supplier filter. Default: all.

.PARAMETER Skip
  Comma-separated suppliers to skip. Default: "" (none).

.EXAMPLE
  .\scripts\flights-orchestration-headless.ps1
  .\scripts\flights-orchestration-headless.ps1 -Skip "YPSILON,FUSION"
#>

param(
    [string]$Suppliers = "",
    [string]$Skip = "",
    [string]$User = "",
    [string]$Mode = "sequential"
)

$ScriptDir = $PSScriptRoot
$MainScript = Join-Path $ScriptDir "flights-orchestration.ps1"

if (-not (Test-Path $MainScript)) {
    Write-Error "Main orchestration script not found: $MainScript"
    exit 1
}

$params = @{
    Headless = $true
    Mode     = $Mode
}
if ($Suppliers -ne "") { $params.Suppliers = $Suppliers }
if ($Skip -ne "")      { $params.Skip = $Skip }
if ($User -ne "")      { $params.User = $User }

& $MainScript @params
exit $LASTEXITCODE
