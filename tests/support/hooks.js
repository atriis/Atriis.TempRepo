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
const { App } = require("../../src/dsl");
const logger = require("@utils/logger").child("Hooks");
const { recordFailure, isRetryEnabled } = require("./retry-handler");

setDefaultTimeout(120000);

/**
 * Determine default provider based on feature file path
 */
function getDefaultProvider(testCase) {
  const featureUri = testCase.gherkinDocument?.uri || testCase.pickle?.uri || "";

  if (featureUri.includes("flight")) return "amadeus";
  if (featureUri.includes("hotel")) return "ratehawk";
  if (featureUri.includes("car")) return "sunny";
  if (featureUri.includes("smoke")) return "amadeus";

  return "amadeus";
}

/**
 * Extract provider from scenario tags
 */
function getProviderFromTags(pickle) {
  const providerTag = pickle.tags.find(tag => tag.name.startsWith("@provider:"));
  if (providerTag) {
    return providerTag.name.replace("@provider:", "").trim();
  }
  return null;
}

/**
 * Extract user key from scenario tags
 */
function getUserKeyFromTags(pickle) {
  const userTag = pickle.tags.find(tag => tag.name.startsWith("@user:"));
  if (userTag) {
    return userTag.name.replace("@user:", "").trim();
  }
  return null;
}

/**
 * Check if scenario should skip "book a new trip"
 */
function isLoginOnly(pickle) {
  return pickle.tags.some(tag => tag.name === "@loginOnly");
}

/**
 * Before each scenario
 */
Before(async function (testCase) {
  // Skip automatic setup if scenario uses parameterized login step
  const hasParameterizedLogin = testCase.pickle.steps.some(step => 
    step.text.includes('I am logged in as "')
  );
  
  if (hasParameterizedLogin) {
    logger.debug("Skipping Before hook - scenario uses parameterized login");
    return;
  }

  logger.info("Setting up browser and logging in...");

  const defaultProvider = getDefaultProvider(testCase);
  const tagProvider = getProviderFromTags(testCase.pickle);
  const tagUserKey = getUserKeyFromTags(testCase.pickle);
  const loginOnly = isLoginOnly(testCase.pickle);

  const provider = (process.env.PROVIDER || tagProvider || defaultProvider).trim();
  const userKey = (process.env.USER_KEY || tagUserKey || "user_one").trim();

  // Validate user exists in config
  const user = config.users?.[provider]?.[userKey];
  if (!user) {
    const availableUsers = Object.keys(config.users?.[provider] || {}).join(", ");
    throw new Error(
      `User "${provider}.${userKey}" not found in config.users.\n` +
      `Available users for ${provider}: ${availableUsers || "none"}\n` +
      "Tip: Use tags like @provider:galileo @user:user_two",
    );
  }

  logger.info("Launching browser and creating context", { provider, userKey });

  // Launch browser and create context
  this.browser = await launchBrowser();
  this.context = await this.browser.newContext({
    viewport: config.viewport,
    screen: config.viewport,
    ignoreHTTPSErrors: true,
  });
  
  this.page = await this.context.newPage();

  // Navigate and login
  await this.page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await App.loginAs(this.page, user);

  if (!loginOnly) {
    logger.info("Starting new trip...");
    this.page = await App.bookANewTrip(this.page);
  } else {
    logger.debug("Login only - no new trip started");
  }

  logger.info("Setup complete");
});

/**
 * After each scenario
 * 
 * - Saves screenshots to disk on failure
 * - Attaches screenshots to Cucumber report
 * - Records failures for retry in CI environments
 */
After(async function (scenario) {
  if (!this.page) {
    return; // No page to capture
  }

  if (scenario.result.status === Status.FAILED) {
    try {
      // Capture screenshot
      const screenshot = await this.page.screenshot({ fullPage: true });
      
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join("test-results", "screenshots");
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      // Generate filename with scenario name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const scenarioName = scenario.pickle.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .substring(0, 50); // Limit length to avoid long filenames
      const filename = `${scenarioName}_${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);

      // Save screenshot to disk
      fs.writeFileSync(filepath, screenshot);
      logger.info("Screenshot saved to disk", { 
        file: filepath, 
        scenario: scenario.pickle.name 
      });

      // Attach to Cucumber & Allure reports (allure-cucumberjs picks up this.attach automatically)
      this.attach(screenshot, "image/png");
      logger.warn("Test failed - screenshot captured", { scenario: scenario.pickle.name });
    } catch (error) {
      logger.error("Failed to capture screenshot", { error: error.message });
    }

    // Record failure for retry in CI
    if (isRetryEnabled()) {
      const error = scenario.result.message || "Scenario failed";
      recordFailure(scenario, new Error(error));
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
