param(
  [string]$RunId = "20260409-161142"
)

$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."

$outDir = "test-results/hotels-orchestration/$RunId"
if (-not (Test-Path $outDir)) {
  throw "Run folder not found: $outDir"
}

$env:HEADLESS = 'true'

$targets = @(
  @{ supplier = 'EXPEDIARAPID'; provider = 'expedia'; feature = 'tests/features/hotels/39426_expedia_can_see_correct_billback.feature' },
  @{ supplier = 'PREMIERINN'; provider = 'premierinn'; feature = 'tests/features/hotels/27039_premier_inn_atos_card.feature' },
  @{ supplier = 'GOGLOBAL'; provider = 'goglobal'; feature = $null }
)

foreach ($t in $targets) {
  $prefix = $t.supplier.ToLower()
  $jsonPath = "$outDir/$prefix-run.json"
  $logPath = "$outDir/$prefix-run.log"

  if (Test-Path $jsonPath) {
    $len = (Get-Item $jsonPath).Length
    if ($len -gt 0) {
      Write-Host "SKIP $($t.supplier): existing JSON size $len"
      continue
    }
  }

  if (-not $t.feature) {
    "No feature tagged for provider:$($t.provider)" | Out-File -FilePath $logPath -Encoding utf8
    "[]" | Out-File -FilePath $jsonPath -Encoding utf8
    Write-Host "BLOCKED $($t.supplier): no feature mapping"
    continue
  }

  $env:PROVIDER = $t.provider
  Write-Host "RUN $($t.supplier) provider=$($t.provider)"

  & npx cucumber-js "$($t.feature)" --tags "@provider:$($t.provider) and not @skip" --format summary --format "json:$jsonPath" --no-strict *>&1 |
    Tee-Object -FilePath $logPath | Out-Null

  Write-Host "EXIT $($t.supplier): $LASTEXITCODE"
}

Write-Host "RESUME_DONE RunId=$RunId"
