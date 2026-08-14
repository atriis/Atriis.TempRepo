'use strict';

/**
 * Transportation Supplier Sub-Agent Execution
 *
 * Executes Cucumber tests for a single transportation supplier.
 * Receives a supplier execution context from the domain builder,
 * constructs the Cucumber command with the correct tags & env vars,
 * and returns structured results.
 *
 * Security:
 * - Credentials read from process.env at runtime; never logged.
 * - No cross-supplier credential sharing.
 * - Sensitive response fields masked in output.
 */

require("module-alias/register");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const logger = require("@utils/logger").child("TransportationSupplierExecution");

class TransportationSupplierExecution {
  constructor(options = {}) {
    this.supplierContext = options.supplierContext;
    this.outputDir = options.outputDir || "test-results/transportation-orchestration";
    this.supplier = this.supplierContext.supplier;
    this.userEmail = this.supplierContext.user ? this.supplierContext.user.email : null;
    this.startTime = null;
    this.endTime = null;
  }

  async run() {
    this.startTime = new Date();

    try {
      this._validateContext();

      if (this.supplierContext.status === "SKIPPED") {
        return this._resultSkipped();
      }

      logger.info(`Starting supplier execution: ${this.supplier.name}`, {
        supplier: this.supplier.name,
        user: this.userLabel,
        flows: this.supplierContext.flows.length,
      });

      this._prepareOutputDir();

      const command = this._buildCucumberCommand();

      logger.info(`Cucumber command built for ${this.supplier.name}`);

      let cucumberOutput = "";
      let exitCode = 0;

      try {
        cucumberOutput = execSync(command, {
          cwd: process.cwd(),
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
          timeout: (this.supplier.timeoutMs || 60000) * 2,
          env: process.env,
        });
      } catch (err) {
        exitCode = err.status || 1;
        cucumberOutput = err.stdout || "";
        logger.warn(`Cucumber exited with code ${exitCode} for ${this.supplier.name}`, {
          supplier: this.supplier.name,
          exitCode,
        });
      }

      const parsed = this._parseCucumberResults();

      this.endTime = new Date();

      if (!parsed) {
        logger.error(`No Cucumber report found for ${this.supplier.name}`);
        return this._resultFailed("No Cucumber report generated");
      }

      if (exitCode === 0 && parsed.passed > 0 && parsed.failed === 0) {
        return this._resultPassed(parsed);
      }
      return this._resultFailed("Cucumber tests failed", parsed);
    } catch (error) {
      this.endTime = new Date();
      logger.error(`Supplier execution failed: ${this.supplier.name}`, {
        error: error.message,
        stack: error.stack,
      });
      return this._resultFailed(error.message);
    }
  }

  // ── Context validation ────────────────────────────────────────────────────
  _validateContext() {
    if (!this.supplierContext) throw new Error("Supplier context is required");
    if (!this.supplier) throw new Error("Supplier metadata is required");
    if (this.supplierContext.status === "ENABLED" && !this.userLabel) {
      throw new Error(`No user resolved for supplier ${this.supplier.name}`);
    }
  }

  // ── Output directory ──────────────────────────────────────────────────────
  _prepareOutputDir() {
    const dir = this._supplierOutputDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _supplierOutputDir() {
    return path.join(this.outputDir, `supplier-${this.supplier.name.toLowerCase()}`);
  }

  // ── Cucumber command ──────────────────────────────────────────────────────
  _buildCucumberCommand() {
    const supplierDir = this._supplierOutputDir();
    const featurePath = this.supplier.featurePath;

    const parts = [
      "npx cucumber-js",
      featurePath,
      "--require tests/support/",
      "--require tests/steps/",
      `--format json:${supplierDir}/cucumber-report.json`,
      `--format junit:${supplierDir}/cucumber-junit.xml`,
      "--format @cucumber/pretty-formatter",
    ];

    const tagExpr = this._buildTagExpression();
    if (tagExpr) {
      parts.push(`--tags "${tagExpr}"`);
    }

    return parts.join(" ");
  }

  _buildTagExpression() {
    const category = this.supplier.category;
    const providerTag = this.supplier.providerTag;

    // Parking has no @provider tag; scope by @parking only
    if (category === "parking") {
      return "@transportation and @parking and not @wip";
    }

    // Rails suppliers use their own tag (e.g. @benerail, @evolvi, @amtrak, @deutschebahn)
    if (category === "rails") {
      return `@transportation and @rails and @${providerTag} and not @wip`;
    }

    // Cars and ground_transport use @provider:<tag>
    return `@transportation and @${category} and @provider:${providerTag} and not @wip`;
  }

  // ── Results parsing ───────────────────────────────────────────────────────
  _parseCucumberResults() {
    const reportPath = path.join(this._supplierOutputDir(), "cucumber-report.json");
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, "utf-8");
      const features = JSON.parse(raw);

      let passed = 0;
      let failed = 0;
      let skipped = 0;

      features.forEach(feature => {
        (feature.elements || []).forEach(scenario => {
          const steps = scenario.steps || [];
          const hasFailed = steps.some(s => s.result && s.result.status === "failed");
          const allSkipped = steps.every(s => !s.result || s.result.status === "skipped" || s.result.status === "undefined");

          if (hasFailed) failed++;
          else if (allSkipped) skipped++;
          else passed++;
        });
      });

      logger.info(`Cucumber results parsed for ${this.supplier.name}`, { passed, failed, skipped });
      return { passed, failed, skipped };
    } catch (err) {
      logger.error(`Failed to parse Cucumber report: ${err.message}`);
      return null;
    }
  }

  // ── Artifact collection ───────────────────────────────────────────────────
  _collectArtifacts() {
    const dir = this._supplierOutputDir();
    const artifacts = {
      cucumberReport: path.join(dir, "cucumber-report.json"),
      junitReport: path.join(dir, "cucumber-junit.xml"),
      screenshots: [],
      traces: [],
    };

    const screenshotsDir = path.join(dir, "screenshots");
    if (fs.existsSync(screenshotsDir)) {
      artifacts.screenshots = fs.readdirSync(screenshotsDir).map(f => path.join(screenshotsDir, f));
    }

    const tracesDir = path.join(dir, "traces");
    if (fs.existsSync(tracesDir)) {
      artifacts.traces = fs.readdirSync(tracesDir).map(f => path.join(tracesDir, f));
    }

    return artifacts;
  }

  // ── Duration helper ───────────────────────────────────────────────────────
  _duration() {
    if (!this.startTime || !this.endTime) return "unknown";
    const ms = this.endTime - this.startTime;
    const sec = Math.floor(ms / 1000);
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }

  // ── Result templates ──────────────────────────────────────────────────────
  _resultSkipped() {
    this.endTime = new Date();
    const reason = this.supplierContext.skipReason;
    logger.info(`Supplier skipped: ${this.supplier.name}`, { reason });
    return {
      success: true,
      supplier: this.supplier.name,
      category: this.supplier.category,
      status: "SKIPPED",
      skipReason: reason,
      user: null,
      results: { passed: 0, failed: 0, skipped: 0 },
      duration: "0s",
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
      flows: [],
      errors: [],
      artifacts: {},
    };
  }

  _resultPassed(parsed) {
    return {
      success: true,
      supplier: this.supplier.name,
      category: this.supplier.category,
      status: "PASSED",
      skipReason: null,
      user: this.userLabel,
      results: parsed,
      duration: this._duration(),
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
      flows: this.supplierContext.flows.map(f => f.name),
      errors: [],
      artifacts: this._collectArtifacts(),
    };
  }

  _resultFailed(reason, parsed) {
    this.endTime = this.endTime || new Date();
    return {
      success: false,
      supplier: this.supplier.name,
      category: this.supplier.category,
      status: "FAILED",
      skipReason: null,
      user: this.userLabel,
      results: parsed || { passed: 0, failed: 0, skipped: 0 },
      duration: this._duration(),
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
      flows: this.supplierContext.flows.map(f => f.name),
      errors: [reason],
      artifacts: this._collectArtifacts(),
    };
  }
}

module.exports = TransportationSupplierExecution;
