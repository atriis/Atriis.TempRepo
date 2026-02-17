/**
 * Register module aliases FIRST before any requires
 */
require("module-alias/register");

/**
 * Cucumber Hooks
 */

const { Before, After, AfterAll, setDefaultTimeout } = require("@cucumber/cucumber");
const { contextPool } = require("./contextPool");
const config = require("../../src/config/config");
const { App } = require("../../src/dsl");
const logger = require("@utils/logger").child("Hooks");

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

  // Get authenticated context from pool (reuses session if already authenticated)
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

  logger.info("Getting authenticated context", { provider, userKey });

  // Get authenticated context from pool (login happens once per worker, then reused)
  this.context = await contextPool.getAuthenticatedContext(provider, userKey);
  
  // CRITICAL: Close any existing pages in the context from previous tests
  // This prevents tab accumulation when bookANewTrip() opens new tabs
  const existingPages = this.context.pages();
  for (const page of existingPages) {
    try {
      await page.close();
    } catch (e) {
      // Page might already be closed, ignore
    }
  }
  
  // Now create a fresh page for this test
  this.page = await this.context.newPage();

  // Get authenticated context from pool (login happens once per worker, then reused)
  this.context = await contextPool.getAuthenticatedContext(provider, userKey);
  this.page = await this.context.newPage();

  // Navigate to app (already logged in via stored session)
  await this.page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });

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
 */
After(async function (scenario) {
  if (scenario.result.status === "failed" && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, "image/png");
  }

  // Close ALL pages in the context to prevent tab accumulation
  // (bookANewTrip opens new tabs, so we need to clean them all up)
  if (this.context) {
    const pages = this.context.pages();
    for (const page of pages) {
      try {
        await page.close();
      } catch (e) {
        // Page might already be closed, ignore
      }
    }
  }
  
  // Context and browser are managed by contextPool - do NOT close them here
});

/**
 * After all tests complete - cleanup the browser context pool
 */
AfterAll(async function () {
  logger.info("All tests complete - cleaning up browser pool");
  await contextPool.cleanup();
});
