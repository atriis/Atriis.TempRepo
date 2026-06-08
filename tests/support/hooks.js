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

  // Shared naming for screenshot + trace artifacts so they line up per scenario.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const featureFile = path.basename(scenario.pickle.uri || "", ".feature");
  const workItemMatch = featureFile.match(/^(\d+)_/);
  const workItemPrefix = workItemMatch ? `${workItemMatch[1]}_` : "";
  const scenarioName = scenario.pickle.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .substring(0, 50);
  const scenarioStatus = String(scenario.result?.status || "unknown").toLowerCase();
  const attemptNumber = (scenario.attempt ?? 0) + 1;
  const artifactBase = `${workItemPrefix}${scenarioName}_attempt${attemptNumber}`;
  const failed = scenario.result?.status === Status.FAILED;

  try {
    const screenshot = await this.page.screenshot({ fullPage: true });
    const screenshotsDir = path.join("test-results", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const filepath = path.join(screenshotsDir, `${artifactBase}_${scenarioStatus}_${timestamp}.png`);

    fs.writeFileSync(filepath, screenshot);
    logger.info("Scenario screenshot saved to disk", {
      file: filepath,
      scenario: scenario.pickle.name,
      status: scenario.result?.status,
    });

    this.attach(screenshot, "image/png");

    if (failed) {
      logger.warn("Test failed - screenshot captured", { scenario: scenario.pickle.name });
    }
  } catch (error) {
    logger.error("Failed to capture screenshot", { error: error.message });
  }

  // In CI, export the Playwright trace for failed scenarios. Open with
  // `npx playwright show-trace <file>` to replay every step and see where it hung.
  if (this.context && process.env.CI && failed) {
    try {
      const tracesDir = path.join("test-results", "traces");
      if (!fs.existsSync(tracesDir)) {
        fs.mkdirSync(tracesDir, { recursive: true });
      }
      const tracePath = path.join(tracesDir, `${artifactBase}_${timestamp}.zip`);
      await this.context.tracing.stop({ path: tracePath });
      logger.info("Failure trace saved to disk", { file: tracePath });
    } catch (error) {
      logger.error("Failed to save trace", { error: error.message });
    }
  }

  // Close context and browser
  if (this.context) {
    await this.context.close();
  }
  if (this.browser) {
    await this.browser.close();
  }
});
