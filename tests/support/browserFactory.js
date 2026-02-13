const { chromium } = require('@playwright/test');

function resolveHeadless() {
  // CI must always be headless
  if (process.env.CI) return true;

  // Local override via env vars (optional)
  const env = process.env.HEADLESS ?? process.env.AUTOMATION_HEADLESS;
  if (env === undefined) return false; // default locally = headed
  return env === 'true';
}

async function launchBrowser() {
  const headless = resolveHeadless();

  const options = {
    headless,
    slowMo: process.env.CI ? 0 : Number(process.env.SLOWMO ?? 0),
  };

  // Optional: only use installed Chrome locally (avoid CI flakiness)
  if (!process.env.CI) {
    options.channel = 'chrome';
  }

  return chromium.launch(options);
}

module.exports = { launchBrowser, resolveHeadless };