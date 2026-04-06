param(
    [string]$DocumentName = 'Atriis.Automation.Env',
    [string]$OutputPath = '.env',
    [string]$Vault
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command op -ErrorAction SilentlyContinue)) {
    throw '1Password CLI (op) is not installed or not available in PATH.'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputFile = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputPath))
$outputDirectory = Split-Path -Parent $outputFile

if (-not (Test-Path $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$arguments = @(
    'document',
    'get',
    $DocumentName,
    '--out-file',
    $outputFile,
    '--force'
)

if ($Vault) {
    $arguments += @('--vault', $Vault)
}

& op @arguments

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Updated $outputFile from 1Password document '$DocumentName'."