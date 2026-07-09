/**
 * Cucumber World
 *
 * Provides shared context for all step definitions.
 * Holds the Playwright browser and page instances.
 */

const { setWorldConstructor, World } = require("@cucumber/cucumber");
const { launchBrowser } = require("./browserFactory");

class CustomWorld extends World {
  constructor(options) {
    super(options);
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize Playwright browser and create a new page
   */
  async init() {
    this.browser = await launchBrowser();

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      // Grant clipboard access so features that copy via navigator.clipboard.write
      // (e.g. the Share dialog "Copy to clipboard" action) resolve their success
      // state instead of silently rejecting. Additive — no effect on other tests.
      permissions: ["clipboard-read", "clipboard-write"],
    });

    this.page = await this.context.newPage();
  }

  /**
   * Close browser and cleanup
   */
  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

setWorldConstructor(CustomWorld);
