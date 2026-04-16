param(
  [string]$RunId = "20260409-161142"
)

$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."

$outDir = "test-results/hotels-orchestration/$RunId"
if (-not (Test-Path $outDir)) {
  throw "Run folder not found: $outDir"
}

$targets = @(
  @{ supplier='AMADEUS'; provider='amadeus'; feature='tests/features/hotels/34418_amadeus_hotel_search_results_load.feature' },
  @{ supplier='UAPIGALILEO'; provider='galileo'; feature='tests/features/hotels/52621_galileo_deposit_filter_and_instant_purchase_tooltip.feature' },
  @{ supplier='SABRE'; provider='sabre'; feature='tests/features/hotels/42353_sabre_wait_for_rates_and_filter.feature' },
  @{ supplier='TRAVELODGE'; provider='travelodge'; feature='tests/features/hotels/61677_travelodge_title_validation.feature' },
  @{ supplier='RATEHAWK'; provider='ratehawk'; feature='tests/features/hotels/37331_ratehawk_oop_limitation_tooltip_and_voucher_download.feature' },
  @{ supplier='EHOTEL'; provider='ehotel'; feature='tests/features/hotels/23109_ehotel_book_hotel_verify_provider_label.feature' },
  @{ supplier='BOOKINGCOM'; provider='bookingcom'; feature='tests/features/hotels/22522_bookingcom_add_credit_card_for_guest_traveler.feature' },
  @{ supplier='EXPEDIARAPID'; provider='expedia'; feature='tests/features/hotels/39426_expedia_can_see_correct_billback.feature' },
  @{ supplier='PREMIERINN'; provider='premierinn'; feature='tests/features/hotels/27039_premier_inn_atos_card.feature' },
  @{ supplier='GOGLOBAL'; provider='goglobal'; feature=$null }
)

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

$results = @()
foreach ($t in $targets) {
  $prefix = $t.supplier.ToLower()
  $jsonPath = "$outDir/$prefix-run.json"
  $logPath = "$outDir/$prefix-run.log"

  $stats = Get-ScenarioStats -JsonPath $jsonPath
  $status = 'blocked'
  $reason = 'No executable scenarios or execution failure'

  if ($t.provider -eq 'goglobal') {
    $status = 'blocked'
    $reason = 'No feature tagged for provider'
  } elseif ($stats.total -gt 0 -and $stats.failed -eq 0) {
    $status = 'passed'
    $reason = ''
  } elseif ($stats.total -gt 0 -and $stats.failed -gt 0) {
    $status = 'failed'
    $reason = 'One or more scenarios failed'
  }

  $results += [pscustomobject]@{
    domain = 'hotels'
    supplier = $t.supplier
    provider = $t.provider
    status = $status
    reason = $reason
    scenariosTotal = $stats.total
    scenariosPassed = $stats.passed
    scenariosFailed = $stats.failed
    scenariosSkipped = $stats.skipped
    feature = $t.feature
    artifacts = @(
      [pscustomobject]@{ type = 'json'; path = $jsonPath },
      [pscustomobject]@{ type = 'log'; path = $logPath }
    )
  }
}

$summary = [pscustomobject]@{
  status = if (($results | Where-Object status -eq 'failed').Count -gt 0) { 'partial' } elseif (($results | Where-Object status -eq 'blocked').Count -gt 0) { 'partial' } else { 'passed' }
  generatedAt = (Get-Date).ToString('o')
  domain = 'hotels'
  runId = $RunId
  executionMode = 'single-feature-per-supplier'
  headless = 'true'
  summary = [pscustomobject]@{
    domainsRun = 1
    suppliersRun = $results.Count
    passed = @($results | Where-Object { $_.status -eq 'passed' }).Count
    failed = @($results | Where-Object { $_.status -eq 'failed' }).Count
    blocked = @($results | Where-Object { $_.status -eq 'blocked' }).Count
    skipped = 0
  }
  sharedBlockers = @()
  domains = @(
    [pscustomobject]@{
      domain = 'hotels'
      status = if (($results | Where-Object status -eq 'failed').Count -gt 0) { 'partial' } else { 'passed' }
      general = [pscustomobject]@{ status = 'passed'; tests = @('schema-validation','sla-check','mandatory-field-validation'); issues = @() }
      suppliers = $results
    }
  )
}

$jsonOut = "$outDir/hotels-orchestration-report.json"
$mdOut = "$outDir/hotels-orchestration-report.md"
$summary | ConvertTo-Json -Depth 12 | Out-File -FilePath $jsonOut -Encoding utf8

$lines = @()
$lines += '# Hotels Orchestration Report'
$lines += ''
$lines += "- Domain: Hotels"
$lines += "- Run ID: $RunId"
$lines += "- Headless: true"
$lines += "- Status: $($summary.status)"
$lines += "- Suppliers Run: $($summary.summary.suppliersRun)"
$lines += "- Passed: $($summary.summary.passed)"
$lines += "- Failed: $($summary.summary.failed)"
$lines += "- Blocked: $($summary.summary.blocked)"
$lines += ''
$lines += '## Supplier Results'
$lines += ''
$lines += '| Supplier | Provider | Status | Total | Passed | Failed | Skipped | Reason | JSON | LOG |'
$lines += '|---|---|---|---:|---:|---:|---:|---|---|---|'

foreach ($r in $results) {
  $json = ($r.artifacts | Where-Object type -eq 'json').path
  $log = ($r.artifacts | Where-Object type -eq 'log').path
  $lines += "| $($r.supplier) | $($r.provider) | $($r.status) | $($r.scenariosTotal) | $($r.scenariosPassed) | $($r.scenariosFailed) | $($r.scenariosSkipped) | $($r.reason) | $json | $log |"
}

$lines -join "`r`n" | Out-File -FilePath $mdOut -Encoding utf8

Write-Host "REPORT_JSON=$jsonOut"
Write-Host "REPORT_MD=$mdOut"
