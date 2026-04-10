#!/usr/bin/env node

/**
 * Transportation Domain Orchestration Script
 *
 * Entry point for executing all transportation suppliers with per-supplier
 * users resolved from .env.
 *
 * Usage:
 *   node scripts/transportation-orchestration.js [--suppliers AMADEUS,BENERAILMOOVE] [--skip DEUTSCHEBAHN,AMTRAK] [--mode parallel|sequential]
 *
 * The script:
 *   1. Builds the Transportation domain context (per-supplier user resolution)
 *   2. Generates supplier sub-agent execution contexts
 *   3. Runs suppliers in parallel or sequential mode
 *   4. Aggregates results into JSON + Markdown reports
 */

require("module-alias/register");
const path = require("path");
const fs = require("fs");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const logger = require("@utils/logger").child("TransportationOrchestration");

const TransportationDomainContextBuilder = require("@config/TransportationDomainContextBuilder");
const TransportationSupplierExecution = require("@config/TransportationSupplierExecution");

/**
 * Parse command-line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .option("suppliers", {
      alias: "s",
      type: "string",
      description: "Comma-separated supplier filter (e.g., 'AMADEUS,BENERAILMOOVE')",
    })
    .option("skip", {
      type: "string",
      description: "Comma-separated suppliers to skip (e.g., 'DEUTSCHEBAHN,AMTRAK')",
    })
    .option("mode", {
      alias: "m",
      type: "string",
      default: "sequential",
      choices: ["parallel", "sequential"],
      description: "Execution mode: parallel (fast) or sequential (debugging)",
    })
    .option("headless", {
      type: "boolean",
      default: true,
      description: "Run browser in headless mode",
    })
    .option("output", {
      alias: "o",
      type: "string",
      description: "Output directory for results (default: test-results/transportation-orchestration/<timestamp>)",
    })
    .help()
    .alias("help", "h")
    .parseSync();
}

/**
 * Generate output directory with timestamp
 */
function generateOutputDir(baseDir = "test-results/transportation-orchestration") {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return path.join(baseDir, timestamp);
}

/**
 * Run suppliers in parallel (batches of 3)
 */
async function runSuppliersParallel(enabledSuppliers, outputDir) {
  const maxConcurrent = 3;
  const results = [];

  for (let i = 0; i < enabledSuppliers.length; i += maxConcurrent) {
    const batch = enabledSuppliers.slice(i, i + maxConcurrent);
    logger.info(`Running batch ${Math.floor(i / maxConcurrent) + 1}: ${batch.map(s => s.supplier.name).join(", ")}`);

    const promises = batch.map(ctx => runSupplier(ctx, outputDir));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Run suppliers sequentially
 */
async function runSuppliersSequential(enabledSuppliers, outputDir) {
  const results = [];

  for (const supplierContext of enabledSuppliers) {
    logger.info(`Running supplier: ${supplierContext.supplier.name}`);
    const result = await runSupplier(supplierContext, outputDir);
    results.push(result);
  }

  return results;
}

/**
 * Run a single supplier
 */
async function runSupplier(supplierContext, outputDir) {
  const execution = new TransportationSupplierExecution({
    supplierContext,
    outputDir,
  });
  return execution.run();
}

/**
 * Aggregate all results
 */
function aggregateResults(allResults) {
  const passed = allResults.filter(r => r.status === "PASSED").length;
  const failed = allResults.filter(r => r.status === "FAILED").length;
  const skipped = allResults.filter(r => r.status === "SKIPPED").length;
  const blocked = allResults.filter(r => r.status === "BLOCKED").length;

  let status = "PASSED";
  if (failed > 0) status = "FAILED";
  else if (blocked > 0) status = "BLOCKED";
  else if (passed === 0 && skipped > 0) status = "SKIPPED";

  return {
    domain: "transportation",
    status,
    timestamp: new Date().toISOString(),
    summary: {
      totalSuppliers: allResults.length,
      passed,
      failed,
      skipped,
      blocked,
    },
    sharedBlockers: [],
    suppliers: allResults,
    recommendations: [
      ...(failed > 0 ? [`${failed} supplier(s) failed. Review artifacts.`] : []),
      ...(skipped > 0 ? [`${skipped} supplier(s) skipped. See skipReason.`] : []),
    ],
  };
}

/**
 * Write JSON report
 */
function writeJsonReport(aggregated, outputDir) {
  const reportPath = path.join(outputDir, "transportation-orchestration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(aggregated, null, 2), "utf-8");
  logger.info(`✓ JSON report written: ${reportPath}`);
}

/**
 * Write Markdown report
 */
function writeMarkdownReport(aggregated, outputDir) {
  const md = [];
  md.push("# Transportation Domain Orchestration Report");
  md.push("");
  md.push(`**Generated**: ${aggregated.timestamp}`);
  md.push(`**Status**: ${aggregated.status}`);
  md.push("");

  md.push("## Summary");
  md.push("| Metric | Count |");
  md.push("|--------|-------|");
  md.push(`| Total Suppliers | ${aggregated.summary.totalSuppliers} |`);
  md.push(`| Passed | ${aggregated.summary.passed} ✓ |`);
  md.push(`| Failed | ${aggregated.summary.failed} ✗ |`);
  md.push(`| Skipped | ${aggregated.summary.skipped} ⊘ |`);
  md.push(`| Blocked | ${aggregated.summary.blocked} ⊗ |`);
  md.push("");

  // Group by category
  const categories = ["cars", "rails", "ground_transport", "parking"];
  for (const cat of categories) {
    const items = aggregated.suppliers.filter(s => s.category === cat);
    if (items.length === 0) continue;

    md.push(`## ${cat.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}`);
    md.push("");

    for (const s of items) {
      const icon = { PASSED: "✓", FAILED: "✗", SKIPPED: "⊘", BLOCKED: "⊗" }[s.status] || "?";
      md.push(`### ${s.supplier} ${icon}`);
      md.push(`- **Status**: ${s.status}`);
      if (s.user) md.push(`- **User**: ${s.user}`);
      if (s.skipReason) md.push(`- **Skip Reason**: ${s.skipReason}`);
      if (s.results) {
        md.push(`- **Passed**: ${s.results.passed}`);
        md.push(`- **Failed**: ${s.results.failed}`);
        md.push(`- **Skipped**: ${s.results.skipped}`);
      }
      md.push(`- **Duration**: ${s.duration || "unknown"}`);
      if (s.errors && s.errors.length > 0) {
        md.push("- **Errors**:");
        s.errors.forEach(e => md.push(`  - ${e}`));
      }
      md.push("");
    }
  }

  if (aggregated.recommendations.length > 0) {
    md.push("## Recommendations");
    aggregated.recommendations.forEach(r => md.push(`- ${r}`));
    md.push("");
  }

  const reportPath = path.join(outputDir, "transportation-orchestration-report.md");
  fs.writeFileSync(reportPath, md.join("\n"), "utf-8");
  logger.info(`✓ Markdown report written: ${reportPath}`);
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();
  const outputDir = args.output || generateOutputDir();

  logger.info("═══════════════════════════════════════════════════");
  logger.info("TRANSPORTATION DOMAIN ORCHESTRATION");
  logger.info("═══════════════════════════════════════════════════");
  logger.info(`Mode: ${args.mode}`);
  logger.info(`Output: ${outputDir}`);
  logger.info("═══════════════════════════════════════════════════");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Step 1: Initialize domain context
    const builder = new TransportationDomainContextBuilder({
      suppliers: args.suppliers || "",
      skipSuppliers: args.skip || "",
    });
    const ctx = await builder.build();

    if (!ctx.success) {
      logger.error(`Domain initialization failed: ${ctx.error}`);
      process.exit(1);
    }

    const enabled = ctx.supplierContexts.filter(s => s.status === "ENABLED");
    const skippedResults = ctx.supplierContexts
      .filter(s => s.status === "SKIPPED")
      .map(s => ({
        supplier: s.supplier.name,
        category: s.supplier.category,
        status: "SKIPPED",
        skipReason: s.skipReason,
        user: null,
        results: { passed: 0, failed: 0, skipped: 0 },
        duration: "0s",
        flows: [],
        errors: [],
        artifacts: {},
      }));

    logger.info(`Enabled: ${enabled.length}  |  Skipped: ${skippedResults.length}`);

    // Step 2: Execute suppliers
    let results;
    if (args.mode === "parallel") {
      results = await runSuppliersParallel(enabled, outputDir);
    } else {
      results = await runSuppliersSequential(enabled, outputDir);
    }

    // Step 3: Aggregate
    const aggregated = aggregateResults([...skippedResults, ...results]);

    logger.info("Results aggregated", {
      status: aggregated.status,
      passed: aggregated.summary.passed,
      failed: aggregated.summary.failed,
      skipped: aggregated.summary.skipped,
    });

    // Step 4: Write reports
    writeJsonReport(aggregated, outputDir);
    writeMarkdownReport(aggregated, outputDir);

    // Step 5: Console summary
    logger.info("═══════════════════════════════════════════════════");
    logger.info(`STATUS: ${aggregated.status}`);
    logger.info(`Passed: ${aggregated.summary.passed}  Failed: ${aggregated.summary.failed}  Skipped: ${aggregated.summary.skipped}  Blocked: ${aggregated.summary.blocked}`);
    logger.info("═══════════════════════════════════════════════════");

    process.exit(aggregated.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error("Fatal error", { error: error.message, stack: error.stack });
    process.exit(2);
  }
}

main();
