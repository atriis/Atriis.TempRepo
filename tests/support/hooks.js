/**
 * Register module aliases FIRST before any requires
 */
require("module-alias/register");

/**
 * Cucumber Hooks
 */

const { Before, After, setDefaultTimeout, Status } = require("@cucumber/cucumber");
const path = require("path");
const fs = require("fs");
const { launchBrowser } = require("./browserFactory");
const config = require("../../src/config/config");
const logger = require("@utils/logger").child("Hooks");

setDefaultTimeout(120000);

/**
 * Before each scenario
 */
Before(async function (testCase) {
  this.scenarioTags = (testCase.pickle?.tags || []).map((tag) => tag.name);

  // All scenarios use parameterized login: `Given I am logged in as "email"`
  // The login step itself handles browser launch and navigation via App.loginAsUser(email).
  // If a scenario is missing a login step, fail early with a clear message.
  const hasParameterizedLogin = testCase.pickle.steps.some(step =>
    step.text.includes('I am logged in as "')
  );

  if (!hasParameterizedLogin) {
    throw new Error(
      `Scenario "${testCase.pickle.name}" has no login step.\n` +
      'All scenarios must start with: Given I am logged in as "email@domain.com"'
    );
  }

  logger.debug("Before hook complete — login handled by step definition");
});

/**
 * After each scenario
 * 
 * - Saves a final screenshot to disk for every scenario
 * - Attaches screenshots to Cucumber report
 * - Records failures for retry in CI environments
 */
After(async function (scenario) {
  if (!this.page) {
    return; // No page to capture
  }

  try {
    const screenshot = await this.page.screenshot({ fullPage: true });
    const screenshotsDir = path.join("test-results", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const scenarioName = scenario.pickle.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .substring(0, 50);
    const scenarioStatus = String(scenario.result?.status || "unknown").toLowerCase();
    const filename = `${scenarioName}_${scenarioStatus}_${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);

    fs.writeFileSync(filepath, screenshot);
    logger.info("Scenario screenshot saved to disk", {
      file: filepath,
      scenario: scenario.pickle.name,
      status: scenario.result?.status,
    });

    this.attach(screenshot, "image/png");

    if (scenario.result.status === Status.FAILED) {
      logger.warn("Test failed - screenshot captured", { scenario: scenario.pickle.name });
    }
  } catch (error) {
    logger.error("Failed to capture screenshot", { error: error.message });
  }

  // Close context and browser
  if (this.context) {
    await this.context.close();
  }
  if (this.browser) {
    await this.browser.close();
  }
});
