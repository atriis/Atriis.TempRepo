const { chromium } = require("@playwright/test");

function resolveHeadless() {
  if (process.env.CI) return true;

  const env = process.env.HEADLESS ?? process.env.AUTOMATION_HEADLESS;
  if (env === undefined) return false;
  return env === "true";
}

async function launchBrowser() {
  const headless = resolveHeadless();

  const options = {
    headless,
    slowMo: process.env.CI ? 0 : Number(process.env.SLOWMO ?? 0),
  };

  if (!process.env.CI) {
    options.channel = "chrome";
  }

  return chromium.launch(options);
}

module.exports = { launchBrowser, resolveHeadless };
