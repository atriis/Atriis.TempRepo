/**
 * Cucumber World
 * 
 * Provides shared context for all step definitions.
 * Holds the Playwright browser and page instances.
 */

const { setWorldConstructor } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

class CustomWorld {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize Playwright browser and create a new page
   */
  async init() {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS === 'true',
      channel: 'chrome',
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
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