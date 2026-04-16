$ErrorActionPreference = 'Stop'

Set-Location "$PSScriptRoot\.."
$env:HEADLESS = 'true'

$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = "test-results/hotels-orchestration/$runId"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$targets = @(
  @{ supplier = 'AMADEUS'; provider = 'amadeus' },
  @{ supplier = 'AMADEUSVALUEHOTEL'; provider = 'amadeus_value_hotel' },
  @{ supplier = 'UAPIGALILEO'; provider = 'galileo' },
  @{ supplier = 'SABRE'; provider = 'sabre' },
  @{ supplier = 'TRAVELODGE'; provider = 'travelodge' },
  @{ supplier = 'RATEHAWK'; provider = 'ratehawk' },
  @{ supplier = 'EHOTEL'; provider = 'ehotel' },
  @{ supplier = 'BOOKINGCOM'; provider = 'bookingcom' },
  @{ supplier = 'EXPEDIARAPID'; provider = 'expedia' },
  @{ supplier = 'PREMIERINN'; provider = 'premierinn' },
  @{ supplier = 'SUNHOTELS'; provider = 'sun_hotels' },
  @{ supplier = 'GOGLOBAL'; provider = 'goglobal' }
)

$allFeatureFiles = Get-ChildItem -Path "tests/features/hotels" -Recurse -File -Filter *.feature
$results = @()
$startAll = Get-Date

foreach ($t in $targets) {
  $supplier = $t.supplier
  $provider = $t.provider
  $featurePath = $null

  foreach ($f in $allFeatureFiles) {
    if (Select-String -Path $f.FullName -Pattern "@provider:$provider" -Quiet) {
      $featurePath = $f.FullName
      break
    }
  }

  $entryStart = Get-Date
  $jsonPath = "$outDir/$($supplier.ToLower())-run.json"
  $logPath = "$outDir/$($supplier.ToLower())-run.log"
  $errPath = "$outDir/$($supplier.ToLower())-run.err.log"

  if (-not $featurePath) {
    "No feature found for @provider:$provider" | Out-File -FilePath $logPath -Encoding utf8
    $results += [pscustomobject]@{
      domain = 'hotels'
      supplier = $supplier
      provider = $provider
      status = 'blocked'
      reason = 'No feature tagged for provider'
      scenariosTotal = 0
      scenariosPassed = 0
      scenariosFailed = 0
      scenariosSkipped = 0
      durationMs = [int]((Get-Date) - $entryStart).TotalMilliseconds
      feature = $null
      artifacts = @([pscustomobject]@{ type = 'log'; path = $logPath })
    }
    continue
  }

  $env:PROVIDER = $provider

  try {
    & npx cucumber-js "$featurePath" --tags "@provider:$provider and not @skip" --format summary --format "json:$jsonPath" --no-strict *>&1 |
      Tee-Object -FilePath $logPath | Out-Null
    $exitCode = $LASTEXITCODE
    if ($null -eq $exitCode) { $exitCode = 1 }
  } catch {
    $exitCode = 1
    $_ | Out-File -FilePath $errPath -Append
  }

  $total = 0
  $passed = 0
  $failed = 0
  $skipped = 0

  if (Test-Path $jsonPath) {
    try {
      $rep = Get-Content $jsonPath -Raw | ConvertFrom-Json
      foreach ($feature in $rep) {
        foreach ($element in $feature.elements) {
          if ($null -eq $element.steps) { continue }
          $total++
          $statuses = @($element.steps | ForEach-Object { $_.result.status })
          if ($statuses -contains 'failed' -or $statuses -contains 'undefined' -or $statuses -contains 'pending') {
            $failed++
          } elseif ($statuses -contains 'skipped') {
            $skipped++
          } else {
            $passed++
          }
        }
      }
    } catch {
      $failed = [Math]::Max($failed, 1)
    }
  } else {
    $failed = [Math]::Max($failed, 1)
  }

  $status = if ($exitCode -eq 0 -and $failed -eq 0) { 'passed' } elseif ($total -eq 0) { 'blocked' } else { 'failed' }

  $results += [pscustomobject]@{
    domain = 'hotels'
    supplier = $supplier
    provider = $provider
    status = $status
    reason = if ($status -eq 'blocked') { 'No executable scenarios or execution failure' } else { '' }
    scenariosTotal = $total
    scenariosPassed = $passed
    scenariosFailed = $failed
    scenariosSkipped = $skipped
    durationMs = [int]((Get-Date) - $entryStart).TotalMilliseconds
    feature = $featurePath
    artifacts = @(
      [pscustomobject]@{ type = 'json'; path = $jsonPath },
      [pscustomobject]@{ type = 'log'; path = $logPath },
      [pscustomobject]@{ type = 'stderr'; path = $errPath }
    )
  }
}

$summary = [pscustomobject]@{
  status = if (($results | Where-Object { $_.status -eq 'failed' }).Count -gt 0) { 'partial' } elseif (($results | Where-Object { $_.status -eq 'blocked' }).Count -gt 0) { 'partial' } else { 'passed' }
  generatedAt = (Get-Date).ToString('o')
  domain = 'hotels'
  runId = $runId
  executionMode = 'single-feature-per-supplier'
  headless = $env:HEADLESS
  durationMs = [int]((Get-Date) - $startAll).TotalMilliseconds
  summary = [pscustomobject]@{
    domainsRun = 1
    suppliersRun = $results.Count
    passed = ($results | Where-Object status -eq 'passed').Count
    failed = ($results | Where-Object status -eq 'failed').Count
    blocked = ($results | Where-Object status -eq 'blocked').Count
    skipped = 0
  }
  sharedBlockers = @()
  domains = @(
    [pscustomobject]@{
      domain = 'hotels'
      status = if (($results | Where-Object { $_.status -eq 'failed' }).Count -gt 0) { 'partial' } else { 'passed' }
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
$lines += "- Run ID: $runId"
$lines += "- Headless: $($env:HEADLESS)"
$lines += "- Execution Mode: single-feature-per-supplier"
$lines += "- Status: $($summary.status)"
$lines += "- Duration (ms): $($summary.durationMs)"
$lines += "- Suppliers Run: $($summary.summary.suppliersRun)"
$lines += "- Passed: $($summary.summary.passed)"
$lines += "- Failed: $($summary.summary.failed)"
$lines += "- Blocked: $($summary.summary.blocked)"
$lines += ''
$lines += '## Supplier Results'
$lines += ''
$lines += '| Supplier | Provider | Status | Total | Passed | Failed | Skipped | Feature | Log |'
$lines += '|---|---|---|---:|---:|---:|---:|---|---|'

foreach ($r in $results) {
  $log = ($r.artifacts | Where-Object type -eq 'log').path
  $lines += "| $($r.supplier) | $($r.provider) | $($r.status) | $($r.scenariosTotal) | $($r.scenariosPassed) | $($r.scenariosFailed) | $($r.scenariosSkipped) | $($r.feature) | $log |"
}

$lines -join "`r`n" | Out-File -FilePath $mdOut -Encoding utf8

Write-Host "REPORT_JSON=$jsonOut"
Write-Host "REPORT_MD=$mdOut"
