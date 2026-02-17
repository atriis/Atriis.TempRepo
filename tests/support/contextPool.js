/**
 * Browser Context Pool
 * 
 * Manages authenticated browser contexts to avoid repeated logins.
 * Each worker authenticates once per provider/user and reuses the session.
 * 
 * Performance impact:
 * - Without pooling: 5,000 tests × 5s login = 25,000s (7 hours)
 * - With pooling: 4 workers × 5s login = 20s total
 * 
 * This reduces OAuth load and speeds up test execution by ~5s per test.
 */

const { launchBrowser } = require("./browserFactory");
const { App } = require("../../src/dsl");
const config = require("../../src/config/config");
const logger = require("@utils/logger").child("ContextPool");
const path = require("path");
const fs = require("fs");

class BrowserContextPool {
  constructor() {
    this.browser = null;
    this.authenticatedContexts = new Map();
    this.storageStateDir = path.join(__dirname, "../../.auth-states");
    
    // Ensure storage state directory exists
    if (!fs.existsSync(this.storageStateDir)) {
      fs.mkdirSync(this.storageStateDir, { recursive: true });
    }
  }

  /**
   * Get storage state file path for a provider/user combination
   * @private
   */
  getStorageStatePath(provider, userKey) {
    return path.join(this.storageStateDir, `${provider}-${userKey}.json`);
  }

  /**
   * Check if stored authentication exists and is fresh
   * @private
   */
  hasValidStorageState(provider, userKey) {
    const statePath = this.getStorageStatePath(provider, userKey);
    if (!fs.existsSync(statePath)) {
      return false;
    }

    // Check if state is less than 1 hour old (OIDC tokens typically expire after 1 hour)
    const stats = fs.statSync(statePath);
    const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;
    return ageMinutes < 55; // Refresh 5 minutes before expiry
  }

  /**
   * Authenticate and save storage state
   * @private
   */
  async authenticateAndSave(provider, userKey) {
    const user = config.users?.[provider]?.[userKey];
    if (!user) {
      throw new Error(`User not found: ${provider}.${userKey}`);
    }

    logger.info("Authenticating for first time", { provider, userKey });

    // Create temporary context for authentication
    const tempContext = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });

    const tempPage = await tempContext.newPage();

    // Perform login
    await tempPage.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
    await App.loginAs(tempPage, user);

    // Save authentication state (cookies + localStorage with OIDC tokens)
    const statePath = this.getStorageStatePath(provider, userKey);
    await tempContext.storageState({ path: statePath });

    logger.info("Authentication state saved", { 
      provider, 
      userKey, 
      path: statePath 
    });

    // Close temporary page (keep context for reuse)
    await tempPage.close();
    
    return tempContext;
  }

  /**
   * Get or create an authenticated browser context
   * 
   * @param {string} provider - Provider name (e.g., 'amadeus', 'sabre')
   * @param {string} userKey - User key (e.g., 'user_one', 'user_two')
   * @returns {Promise<import('@playwright/test').BrowserContext>}
   */
  async getAuthenticatedContext(provider, userKey) {
    const contextKey = `${provider}:${userKey}`;

    // Return existing context if available and active
    if (this.authenticatedContexts.has(contextKey)) {
      const ctx = this.authenticatedContexts.get(contextKey);
      // Verify context is still valid
      try {
        await ctx.pages(); // This will throw if context is closed
        logger.debug("Reusing existing context", { provider, userKey });
        return ctx;
      } catch (e) {
        // Context was closed, remove from pool
        this.authenticatedContexts.delete(contextKey);
      }
    }

    // Ensure browser is launched
    if (!this.browser) {
      logger.info("Launching shared browser instance");
      this.browser = await launchBrowser();
    }

    let context;

    // Try to reuse saved authentication state
    const statePath = this.getStorageStatePath(provider, userKey);
    if (this.hasValidStorageState(provider, userKey)) {
      logger.info("Loading saved authentication state", { provider, userKey });
      context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        screen: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        storageState: statePath, // Restore cookies + localStorage
      });
    } else {
      // Authenticate fresh and save state
      context = await this.authenticateAndSave(provider, userKey);
    }

    // Store in pool
    this.authenticatedContexts.set(contextKey, context);
    
    logger.info("Context ready for reuse", { 
      provider, 
      userKey,
      poolSize: this.authenticatedContexts.size 
    });

    return context;
  }

  /**
   * Close all contexts and browser (called after all tests)
   */
  async cleanup() {
    logger.info("Cleaning up browser context pool");

    for (const [key, context] of this.authenticatedContexts) {
      try {
        await context.close();
      } catch (e) {
        logger.warn("Failed to close context", { key, error: e.message });
      }
    }

    this.authenticatedContexts.clear();

    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {
        logger.warn("Failed to close browser", { error: e.message });
      }
      this.browser = null;
    }

    logger.info("Cleanup complete");
  }

  /**
   * Clear saved authentication states (useful for forced re-authentication)
   */
  clearStorageStates() {
    logger.info("Clearing all saved authentication states");
    
    if (fs.existsSync(this.storageStateDir)) {
      const files = fs.readdirSync(this.storageStateDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(this.storageStateDir, file));
      });
      logger.info("Cleared storage states", { count: files.length });
    }
  }
}

// Singleton instance - one pool per worker process
const contextPool = new BrowserContextPool();

module.exports = { contextPool };
