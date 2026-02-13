/**
 * Register module aliases FIRST before any requires
 */
require("module-alias/register");

/**
 * Cucumber Hooks
 */

const { Before, After, setDefaultTimeout } = require("@cucumber/cucumber");
const { launchBrowser } = require("./browserFactory");
const config = require("../../src/config/config");
const { App } = require("../../src/dsl");

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
    console.log("Skipping Before hook - scenario uses parameterized login");
    return;
  }

  console.log("Setting up browser and logging in...");

  const headlessEnv = process.env.HEADLESS || process.env.AUTOMATION_HEADLESS || "false";
  const isHeadless = headlessEnv === "true";

  this.browser = await launchBrowser();

  this.context = await this.browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();

  // Priority: env var > tags > default
  const defaultProvider = getDefaultProvider(testCase);
  const tagProvider = getProviderFromTags(testCase.pickle);
  const tagUserKey = getUserKeyFromTags(testCase.pickle);
  const loginOnly = isLoginOnly(testCase.pickle);

  const provider = (process.env.PROVIDER || tagProvider || defaultProvider).trim();
  const userKey = (process.env.USER_KEY || tagUserKey || "user_one").trim();

  const user = config.users?.[provider]?.[userKey];

  if (!user) {
    const availableUsers = Object.keys(config.users?.[provider] || {}).join(", ");
    throw new Error(
      `User "${provider}.${userKey}" not found in config.users.\n` +
      `Available users for ${provider}: ${availableUsers || "none"}\n` +
      "Tip: Use tags like @provider:galileo @user:user_two",
    );
  }

  console.log(`Logging in as ${provider}.${userKey}`);

  await this.page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await App.loginAs(this.page, user);

  if (!loginOnly) {
    console.log("Starting new trip...");
    this.page = await App.bookANewTrip(this.page);
  } else {
    console.log("Login only - no new trip started");
  }

  console.log("Setup complete");
});

/**
 * After each scenario
 */
After(async function (scenario) {
  if (scenario.result.status === "failed" && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, "image/png");
  }

  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
  if (this.browser) await this.browser.close();
});
