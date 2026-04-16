param(
  [string]$Suppliers = "RATEHAWK,BOOKINGCOM,EXPEDIARAPID,GOGLOBAL,AMADEUSVALUEHOTEL,SUNHOTELS"
)

$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."

$env:HEADLESS = 'true'
$runId = "rerun-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$outDir = "test-results/hotels-orchestration/$runId"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$catalog = @{
  RATEHAWK   = @{ provider='ratehawk'; feature='tests/features/hotels/37331_ratehawk_oop_limitation_tooltip_and_voucher_download.feature' }
  BOOKINGCOM = @{ provider='bookingcom'; feature='tests/features/hotels/22522_bookingcom_add_credit_card_for_guest_traveler.feature' }
  EXPEDIARAPID = @{ provider='expedia'; feature='tests/features/hotels/39426_expedia_can_see_correct_billback.feature' }
  GOGLOBAL   = @{ provider='goglobal'; feature='tests/features/hotels/76000_goglobal_basic_search_and_cart.feature' }
  AMADEUSVALUEHOTEL = @{ provider='amadeus_value_hotel'; feature='tests/features/hotels/34527_amadeus_value_hotels_cancellation_policy.feature' }
  SUNHOTELS = @{ provider='sun_hotels'; feature='tests/features/hotels/76001_sun_hotels_basic_search.feature' }
}

$targets = $Suppliers.Split(',') | ForEach-Object { $_.Trim().ToUpper() } | Where-Object { $_ -ne '' }
$results = @()

function Get-ScenarioStats {
  param([string]$JsonPath)

  $stats = [ordered]@{ total = 0; passed = 0; failed = 0; skipped = 0 }
  if (-not (Test-Path $JsonPath)) { return $stats }

  $raw = Get-Content $JsonPath -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) { return $stats }

  $report = $raw | ConvertFrom-Json
  foreach ($feature in $report) {
    foreach ($element in $feature.elements) {
      if ($null -eq $element.steps) { continue }
      $stats.total++
      $stepStatuses = @($element.steps | ForEach-Object { $_.result.status })
      if ($stepStatuses -contains 'failed' -or $stepStatuses -contains 'undefined' -or $stepStatuses -contains 'pending') {
        $stats.failed++
      } elseif ($stepStatuses -contains 'skipped') {
        $stats.skipped++
      } else {
        $stats.passed++
      }
    }
  }

  return $stats
}

foreach ($supplier in $targets) {
  if (-not $catalog.ContainsKey($supplier)) {
    continue
  }

  $provider = $catalog[$supplier].provider
  $feature = $catalog[$supplier].feature
  $jsonPath = "$outDir/$($supplier.ToLower())-run.json"
  $logPath = "$outDir/$($supplier.ToLower())-run.log"

  if (-not $feature) {
    "No feature tagged for provider:$provider" | Out-File -FilePath $logPath -Encoding utf8
    "[]" | Out-File -FilePath $jsonPath -Encoding utf8

    $results += [pscustomobject]@{
      supplier = $supplier
      provider = $provider
      status = 'blocked'
      reason = 'No feature tagged for provider'
      scenariosTotal = 0
      scenariosPassed = 0
      scenariosFailed = 0
      scenariosSkipped = 0
      json = $jsonPath
      log = $logPath
    }
    continue
  }

  $env:PROVIDER = $provider
  & npx cucumber-js "$feature" --tags "@provider:$provider and not @skip" --format summary --format "json:$jsonPath" --no-strict *>&1 |
    Tee-Object -FilePath $logPath | Out-Null

  $stats = Get-ScenarioStats -JsonPath $jsonPath

  $status = if ($stats.total -gt 0 -and $stats.failed -eq 0) { 'passed' } elseif ($stats.total -gt 0 -and $stats.failed -gt 0) { 'failed' } else { 'blocked' }
  $reason = if ($status -eq 'failed') { 'One or more scenarios failed' } elseif ($status -eq 'blocked') { 'No executable scenarios or execution failure' } else { '' }

  $results += [pscustomobject]@{
    supplier = $supplier
    provider = $provider
    status = $status
    reason = $reason
    scenariosTotal = $stats.total
    scenariosPassed = $stats.passed
    scenariosFailed = $stats.failed
    scenariosSkipped = $stats.skipped
    json = $jsonPath
    log = $logPath
  }
}

$summary = [pscustomobject]@{
  runId = $runId
  domain = 'hotels'
  headless = 'true'
  suppliers = $targets
  totals = [pscustomobject]@{
    suppliersRun = $results.Count
    passed = @($results | Where-Object { $_.status -eq 'passed' }).Count
    failed = @($results | Where-Object { $_.status -eq 'failed' }).Count
    blocked = @($results | Where-Object { $_.status -eq 'blocked' }).Count
  }
  results = $results
}

$jsonOut = "$outDir/hotels-selected-rerun-report.json"
$mdOut = "$outDir/hotels-selected-rerun-report.md"
$summary | ConvertTo-Json -Depth 8 | Out-File -FilePath $jsonOut -Encoding utf8

$lines = @()
$lines += '# Hotels Selected Suppliers Rerun Report'
$lines += ''
$lines += "- Run ID: $runId"
$lines += "- Domain: Hotels"
$lines += "- Headless: true"
$lines += "- Suppliers Run: $($summary.totals.suppliersRun)"
$lines += "- Passed: $($summary.totals.passed)"
$lines += "- Failed: $($summary.totals.failed)"
$lines += "- Blocked: $($summary.totals.blocked)"
$lines += ''
$lines += '| Supplier | Provider | Status | Total | Passed | Failed | Skipped | Reason | JSON | LOG |'
$lines += '|---|---|---|---:|---:|---:|---:|---|---|---|'
foreach ($r in $results) {
  $lines += "| $($r.supplier) | $($r.provider) | $($r.status) | $($r.scenariosTotal) | $($r.scenariosPassed) | $($r.scenariosFailed) | $($r.scenariosSkipped) | $($r.reason) | $($r.json) | $($r.log) |"
}
$lines -join "`r`n" | Out-File -FilePath $mdOut -Encoding utf8

Write-Host "REPORT_JSON=$jsonOut"
Write-Host "REPORT_MD=$mdOut"
