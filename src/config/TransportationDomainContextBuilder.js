'use strict';

/**
 * Transportation Domain Context Builder
 *
 * Validates users per supplier, builds domain context, and generates
 * individual supplier execution contexts. Unlike the Flights domain which
 * uses a single domain user, Transportation maps each supplier to its own
 * users from the static users registry (src/config/users.js).
 *
 * Workflow:
 *   1. Validate per-supplier users from the registry
 *   2. Build shared domain context (rules, data, flows)
 *   3. Generate supplier execution contexts with user + compatibility status
 *   4. Log initialization summary
 */

require("module-alias/register");
const dotenv = require("dotenv");
const logger = require("@utils/logger").child("TransportationDomainContext");

dotenv.config();

const config = require("./transportation-orchestration.config");

class TransportationDomainContextBuilder {
  constructor(options = {}) {
    this.options = options;
    this.supplierContexts = [];
    this.domainContext = null;
    this.userResolution = {};
    this.errors = [];
    this.warnings = [];
  }

  async build() {
    try {
      logger.info("Building Transportation domain context…", {
        suppliers: this.options.suppliers || "all",
      });

      this._resolveSupplierUsers();
      this._buildDomainContext();
      this._generateSupplierContexts();
      this._logInitializationSummary();

      const enabled = this.supplierContexts.filter(s => s.status === "ENABLED").length;

      if (enabled === 0) {
        const msg = "Transportation domain skipped – no valid user mapping for any supplier";
        logger.error(msg);
        this.errors.push(msg);
        return { success: false, error: msg, errors: this.errors, warnings: this.warnings };
      }

      logger.info(`Transportation domain context built: ${enabled} suppliers enabled`);

      return {
        success: true,
        domainContext: this.domainContext,
        supplierContexts: this.supplierContexts,
        userResolution: this.userResolution,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      logger.error("Context build failed", { error: error.message, stack: error.stack });
      return { success: false, error: error.message, errors: [error.message], warnings: this.warnings };
    }
  }

  // ── Step 1: Resolve per-supplier users from .env ──────────────────────────
  _resolveSupplierUsers() {
    const skipList = (this.options.skipSuppliers || "")
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const onlySuppliers = (this.options.suppliers || "")
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    config.SUPPLIERS.forEach(supplier => {
      const name = supplier.name;

      if (onlySuppliers.length > 0 && !onlySuppliers.includes(name)) {
        this.userResolution[name] = { status: "SKIPPED", reason: "NOT_IN_FILTER", user: null };
        return;
      }
      if (skipList.includes(name)) {
        this.userResolution[name] = { status: "SKIPPED", reason: "MANUALLY_SKIPPED", user: null };
        return;
      }

      const users = config.getUsersForSupplier(name);
      if (!users || users.length === 0) {
        this.userResolution[name] = { status: "SKIPPED", reason: "NO_USER_MAPPING", user: null };
        this.warnings.push(`${name}: no user mapping in config`);
        return;
      }

      // Use the first email from the supplier mapping directly
      const email = users[0];
      this.userResolution[name] = { status: "ENABLED", reason: null, user: { email } };
    });
  }

  // ── Step 2: Build shared domain context ───────────────────────────────────
  _buildDomainContext() {
    this.domainContext = {
      domain: "transportation",
      timestamp: new Date().toISOString(),
      businessRules: config.SHARED_BUSINESS_RULES.map(r => ({
        rule: r.rule, description: r.description, enforcement: r.enforcement,
      })),
      testData: config.DOMAIN_TEST_DATA,
      flows: Object.entries(config.TRANSPORT_FLOWS).map(([name, def]) => ({
        name, description: def.description, tags: def.tags, categories: def.categories,
      })),
      executionPolicy: { ...config.EXECUTION_POLICIES },
      knownIssues: config.KNOWN_ISSUES.map(i => ({
        supplier: i.supplier, issue: i.issue, recommendation: i.recommendation,
      })),
      failureCategories: config.FAILURE_CATEGORIES,
    };
  }

  // ── Step 3: Generate supplier execution contexts ──────────────────────────
  _generateSupplierContexts() {
    config.SUPPLIERS.forEach(supplier => {
      const resolution = this.userResolution[supplier.name] || {};
      const status = resolution.status || "SKIPPED";
      const skipReason = resolution.reason || "UNKNOWN";

      const ctx = {
        domain: "transportation",
        supplier: {
          name: supplier.name,
          category: supplier.category,
          type: supplier.type,
          transportTypes: supplier.transportTypes,
          endpoint: supplier.endpoint,
          authMethod: supplier.authMethod,
          featurePath: supplier.featurePath,
          providerTag: supplier.providerTag,
          supportedFlows: supplier.supportedFlows,
          knownLimitations: supplier.knownLimitations,
          retryPolicy: supplier.retryPolicy,
          timeoutMs: supplier.timeoutMs,
        },
        user: status === "ENABLED" ? { email: resolution.user.email } : null,
        status,
        skipReason: status === "SKIPPED" ? skipReason : null,
        flows: this.domainContext.flows.filter(f =>
          f.categories.includes(supplier.category) &&
          supplier.supportedFlows.some(sf => sf === f.name),
        ),
        businessRules: this.domainContext.businessRules,
        testData: this.domainContext.testData,
        executionPolicy: this.domainContext.executionPolicy,
      };

      this.supplierContexts.push(ctx);
    });

    logger.info("Supplier execution contexts generated", {
      total: this.supplierContexts.length,
      enabled: this.supplierContexts.filter(s => s.status === "ENABLED").length,
      skipped: this.supplierContexts.filter(s => s.status === "SKIPPED").length,
    });
  }

  // ── Step 4: Log initialization summary ────────────────────────────────────
  _logInitializationSummary() {
    const enabled = this.supplierContexts.filter(s => s.status === "ENABLED");
    const skipped = this.supplierContexts.filter(s => s.status === "SKIPPED");

    logger.info("───────────────────────────────────────");
    logger.info("TRANSPORTATION DOMAIN INITIALIZATION");
    logger.info("───────────────────────────────────────");
    logger.info(`Total Suppliers:   ${this.supplierContexts.length}`);
    logger.info(`Enabled:           ${enabled.length}`);
    logger.info(`Skipped:           ${skipped.length}`);

    enabled.forEach(s => {
      logger.info(`  ✓ ${s.supplier.name} [${s.supplier.category}] — user: ${s.user.email}`);
    });

    skipped.forEach(s => {
      logger.info(`  ⊘ ${s.supplier.name} [${s.supplier.category}] — ${s.skipReason}`);
    });

    logger.info("───────────────────────────────────────");
  }
}

module.exports = TransportationDomainContextBuilder;
