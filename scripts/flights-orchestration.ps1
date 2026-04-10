<#
.SYNOPSIS
  Flights Domain Orchestration — runs Cucumber BDD tests per-supplier and aggregates results.

.DESCRIPTION
  Reads src/config/flights-orchestration.json, iterates each enabled supplier,
  runs `npx cucumber-js` with the matching tag expression, captures exit codes,
  then writes a JSON report and a Markdown summary.

  No existing project files are modified. The script only reads config and
  invokes Cucumber with different tag filters.

.PARAMETER Suppliers
  Comma-separated supplier names to include. Default: all.
  Example: -Suppliers "AMADEUS,SABRE,AFKL"

.PARAMETER Skip
  Comma-separated supplier names to skip.
  Example: -Skip "YPSILON,FUSION"

.PARAMETER User
  Override the domain user label for all runs.
  Each scenario already has its own user in Gherkin, so this is informational
  and sets USER_KEY env var for the Before hook fallback.

.PARAMETER Mode
  parallel | sequential (default: sequential — safer for BDD tests sharing browser state)

.PARAMETER Headless
  $true | $false (default: from config)

.EXAMPLE
  .\scripts\flights-orchestration.ps1
  .\scripts\flights-orchestration.ps1 -Suppliers "AMADEUS,SABRE"
  .\scripts\flights-orchestration.ps1 -Skip "YPSILON,FUSION" -Headless $true
#>

param(
    [string]$Suppliers = "",
    [string]$Skip = "",
    [string]$User = "",
    [string]$Mode = "sequential",
    [Nullable[bool]]$Headless = $null
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# ─── Paths ────────────────────────────────────────────────────────────────────
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ConfigPath  = Join-Path $ProjectRoot "src/config/flights-orchestration.json"
$Timestamp   = Get-Date -Format "yyyyMMdd-HHmmss"
$OutDir      = Join-Path $ProjectRoot "test-results/flights-orchestration/$Timestamp"

if (-not (Test-Path $ConfigPath)) {
    Write-Error "Config not found: $ConfigPath"
    exit 1
}

# ─── Load config ──────────────────────────────────────────────────────────────
$Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$HeadlessMode = if ($null -ne $Headless) { $Headless } else { $Config.execution.headless }

# ─── Resolve supplier list ────────────────────────────────────────────────────
$AllSupplierNames = $Config.suppliers.PSObject.Properties.Name

if ($Suppliers -ne "") {
    $TargetSuppliers = $Suppliers.Split(",") | ForEach-Object { $_.Trim().ToUpper() }
} else {
    $TargetSuppliers = $AllSupplierNames
}

if ($Skip -ne "") {
    $SkipList = $Skip.Split(",") | ForEach-Object { $_.Trim().ToUpper() }
    $TargetSuppliers = $TargetSuppliers | Where-Object { $_ -notin $SkipList }
}

# Validate all requested suppliers exist in config
foreach ($s in $TargetSuppliers) {
    if ($s -notin $AllSupplierNames) {
        Write-Warning "Supplier '$s' not found in config — skipping."
        $TargetSuppliers = $TargetSuppliers | Where-Object { $_ -ne $s }
    }
}

if ($TargetSuppliers.Count -eq 0) {
    Write-Error "No valid suppliers to run."
    exit 1
}

# ─── Prepare output dir ──────────────────────────────────────────────────────
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# ─── Header ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       FLIGHTS DOMAIN ORCHESTRATION                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Suppliers : $($TargetSuppliers -join ', ')"
Write-Host "  Mode      : $Mode"
Write-Host "  Headless  : $HeadlessMode"
Write-Host "  Output    : $OutDir"
Write-Host "  Timestamp : $Timestamp"
Write-Host ""

# ─── Run one supplier ─────────────────────────────────────────────────────────
function Invoke-SupplierRun {
    param(
        [string]$SupplierName
    )

    $Supplier = $Config.suppliers.$SupplierName
    $SupplierLower = $SupplierName.ToLower()
    $SupplierDir = Join-Path $OutDir "supplier-$SupplierLower"
    New-Item -ItemType Directory -Path $SupplierDir -Force | Out-Null

    $TagExpr = $Supplier.tags
    $FeaturePaths = $Supplier.featurePaths -join " "
    $ReportJson = Join-Path $SupplierDir "cucumber-report.json"
    $ReportXml  = Join-Path $SupplierDir "cucumber-junit.xml"
    $LogFile    = Join-Path $SupplierDir "run.log"

    Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  ▸ $SupplierName ($($Supplier.type))" -ForegroundColor Yellow
    Write-Host "    Tags     : $TagExpr"
    Write-Host "    Features : $FeaturePaths"

    $StartTime = Get-Date

    # Build env vars
    $env:HEADLESS = if ($HeadlessMode) { "true" } else { "false" }
    if ($User -ne "") { $env:USER_KEY = $User }

    # Build cucumber command
    $CmdArgs = @(
        "cucumber-js"
        $FeaturePaths
        "--tags", "`"$TagExpr`""
        "--format", "summary"
        "--format", "json:$ReportJson"
        "--format", "junit:$ReportXml"
    )

    $TimeoutSec = $Config.execution.timeoutPerSupplierSeconds

    try {
        $Output = & npx @CmdArgs 2>&1 | Tee-Object -FilePath $LogFile
        $ExitCode = $LASTEXITCODE
    } catch {
        $Output = $_.Exception.Message
        $ExitCode = 99
        $Output | Out-File -FilePath $LogFile -Append
    }

    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime

    # Parse results from JSON report
    $Passed = 0; $Failed = 0; $Skipped = 0; $Total = 0
    if (Test-Path $ReportJson) {
        try {
            $Raw = Get-Content $ReportJson -Raw | ConvertFrom-Json
            foreach ($feature in $Raw) {
                foreach ($element in $feature.elements) {
                    if ($null -eq $element.type -or $element.type -ne "scenario") { continue }
                    $Total++
                    $stepStatuses = $element.steps | ForEach-Object { $_.result.status }
                    if ($stepStatuses -contains "failed") { $Failed++ }
                    elseif ($stepStatuses -contains "skipped" -or $stepStatuses -contains "undefined") { $Skipped++ }
                    else { $Passed++ }
                }
            }
        } catch {
            Write-Warning "    Could not parse cucumber report for $SupplierName"
        }
    }

    $Status = if ($ExitCode -eq 0 -and $Failed -eq 0) { "PASSED" }
              elseif ($Total -eq 0) { "NO_TESTS" }
              elseif ($Failed -gt 0) { "FAILED" }
              else { "ERROR" }

    $StatusColor = switch ($Status) {
        "PASSED"   { "Green" }
        "FAILED"   { "Red" }
        "NO_TESTS" { "DarkYellow" }
        default    { "Magenta" }
    }

    Write-Host "    Status   : " -NoNewline
    Write-Host $Status -ForegroundColor $StatusColor
    Write-Host "    Results  : $Passed passed, $Failed failed, $Skipped skipped ($Total total)"
    Write-Host "    Duration : $([math]::Round($Duration.TotalSeconds))s"

    return [PSCustomObject]@{
        Supplier  = $SupplierName
        Type      = $Supplier.type
        Status    = $Status
        ExitCode  = $ExitCode
        Passed    = $Passed
        Failed    = $Failed
        Skipped   = $Skipped
        Total     = $Total
        Duration  = [math]::Round($Duration.TotalSeconds)
        Tags      = $TagExpr
        LogFile   = $LogFile
        ReportJson = $ReportJson
        ReportXml  = $ReportXml
        Notes     = if ($Config.knownIssues.PSObject.Properties.Name -contains $SupplierName) { $Config.knownIssues.$SupplierName } else { "" }
    }
}

# ─── Execute ──────────────────────────────────────────────────────────────────
$Results = @()
$OrcStartTime = Get-Date

foreach ($SupplierName in $TargetSuppliers) {
    $result = Invoke-SupplierRun -SupplierName $SupplierName
    $Results += $result

    # Bail on blocker (e.g. app unreachable) unless continue-on-failure
    if ($result.Status -eq "ERROR" -and -not $Config.execution.continueOnSupplierFailure) {
        Write-Error "Supplier $SupplierName returned ERROR and continueOnSupplierFailure=false. Aborting."
        break
    }
}

$OrcEndTime = Get-Date
$OrcDuration = $OrcEndTime - $OrcStartTime

# ─── Aggregate ────────────────────────────────────────────────────────────────
$TotalPassed  = ($Results | Measure-Object -Property Passed  -Sum).Sum
$TotalFailed  = ($Results | Measure-Object -Property Failed  -Sum).Sum
$TotalSkipped = ($Results | Measure-Object -Property Skipped -Sum).Sum
$TotalTests   = ($Results | Measure-Object -Property Total   -Sum).Sum
$SuppliersRun = $Results.Count
$SuppliersPassed  = ($Results | Where-Object { $_.Status -eq "PASSED" }).Count
$SuppliersFailed  = ($Results | Where-Object { $_.Status -eq "FAILED" }).Count
$SuppliersNoTests = ($Results | Where-Object { $_.Status -eq "NO_TESTS" }).Count
$SuppliersError   = ($Results | Where-Object { $_.Status -eq "ERROR" }).Count

$OverallStatus = if ($TotalFailed -eq 0 -and $SuppliersError -eq 0) { "PASSED" }
                 elseif ($SuppliersPassed -gt 0) { "PARTIAL" }
                 else { "FAILED" }

# ─── JSON Report ──────────────────────────────────────────────────────────────
$Report = [ordered]@{
    domain        = "flights"
    status        = $OverallStatus
    timestamp     = $Timestamp
    durationSeconds = [math]::Round($OrcDuration.TotalSeconds)
    summary       = [ordered]@{
        suppliersRun     = $SuppliersRun
        suppliersPassed  = $SuppliersPassed
        suppliersFailed  = $SuppliersFailed
        suppliersNoTests = $SuppliersNoTests
        suppliersError   = $SuppliersError
        totalScenarios   = $TotalTests
        passed           = $TotalPassed
        failed           = $TotalFailed
        skipped          = $TotalSkipped
    }
    suppliers = $Results | ForEach-Object {
        [ordered]@{
            supplier  = $_.Supplier
            type      = $_.Type
            status    = $_.Status
            passed    = $_.Passed
            failed    = $_.Failed
            skipped   = $_.Skipped
            total     = $_.Total
            duration  = $_.Duration
            tags      = $_.Tags
            notes     = $_.Notes
            artifacts = [ordered]@{
                log        = $_.LogFile
                reportJson = $_.ReportJson
                reportXml  = $_.ReportXml
            }
        }
    }
    businessRules = $Config.businessRules
}

$JsonOut = Join-Path $OutDir "flights-orchestration-report.json"
$Report | ConvertTo-Json -Depth 5 | Out-File -FilePath $JsonOut -Encoding utf8
Write-Host ""
Write-Host "  JSON report: $JsonOut" -ForegroundColor DarkGray

# ─── Markdown Report ──────────────────────────────────────────────────────────
$md = @()
$md += "# Flights Orchestration Report"
$md += ""
$md += "| Key | Value |"
$md += "|-----|-------|"
$md += "| Status | **$OverallStatus** |"
$md += "| Timestamp | $Timestamp |"
$md += "| Duration | $([math]::Round($OrcDuration.TotalSeconds))s |"
$md += "| Suppliers Run | $SuppliersRun |"
$md += "| Scenarios | $TotalPassed passed / $TotalFailed failed / $TotalSkipped skipped |"
$md += ""
$md += "## Suppliers"
$md += ""
$md += "| Supplier | Type | Status | Passed | Failed | Skipped | Duration | Notes |"
$md += "|----------|------|--------|--------|--------|---------|----------|-------|"

foreach ($r in $Results) {
    $icon = switch ($r.Status) {
        "PASSED"   { "✅" }
        "FAILED"   { "❌" }
        "NO_TESTS" { "⚠️" }
        default    { "🔴" }
    }
    $md += "| $($r.Supplier) | $($r.Type) | $icon $($r.Status) | $($r.Passed) | $($r.Failed) | $($r.Skipped) | $($r.Duration)s | $($r.Notes) |"
}

$md += ""
$md += "## Business Rules"
$md += ""
foreach ($rule in $Config.businessRules) {
    $md += "- $rule"
}

$MdOut = Join-Path $OutDir "flights-orchestration-report.md"
$md -join "`n" | Out-File -FilePath $MdOut -Encoding utf8
Write-Host "  Markdown  : $MdOut" -ForegroundColor DarkGray

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       FLIGHTS ORCHESTRATION COMPLETE                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Status    : " -NoNewline
$summaryColor = switch ($OverallStatus) { "PASSED" { "Green" } "PARTIAL" { "Yellow" } default { "Red" } }
Write-Host $OverallStatus -ForegroundColor $summaryColor
Write-Host "  Suppliers : $SuppliersPassed passed, $SuppliersFailed failed, $SuppliersNoTests no tests, $SuppliersError error"
Write-Host "  Scenarios : $TotalPassed passed, $TotalFailed failed, $TotalSkipped skipped ($TotalTests total)"
Write-Host "  Duration  : $([math]::Round($OrcDuration.TotalSeconds))s"
Write-Host ""

# Emit paths for CI consumption
Write-Host "REPORT_JSON=$JsonOut"
Write-Host "REPORT_MD=$MdOut"

# Exit with appropriate code
if ($OverallStatus -eq "PASSED") { exit 0 } else { exit 1 }
