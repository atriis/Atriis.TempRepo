const base = require('@playwright/test');
const config = require('../../src/config/config');
const App = require('../../src/dsl/App');

function getUserFromConfig(provider, userKey) {
  const user = config.users?.[provider]?.[userKey];

  if (!user) {
    const availableUsers = Object.keys(config.users || {})
      .map(p => Object.keys(config.users[p] || {}).map(u => `${p}.${u}`))
      .flat()
      .join(', ');

    throw new Error(
      `User "${provider}.${userKey}" not found in config.users. Available: ${availableUsers}`
    );
  }

  return user;
}

const test = base.test.extend({
  newTripPage: async ({ page }, use, testInfo) => {
    const supplier = testInfo.project.use?.supplierContext;

    if (!supplier) {
      throw new Error(
        'supplierContext is missing. Run using a supplier project, e.g. --project=amadeus-user-one'
      );
    }

    const { provider, userKey } = supplier;
    const user = getUserFromConfig(provider, userKey);

    console.log(`Fixture: logging in as ${provider}.${userKey}`);
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });

    // user shape from config: { email, password }
    await App.loginAs(page, user);

    const tripPage = await App.bookANewTrip(page);
    await use(tripPage);
  },

  loggedInPage: async ({ page }, use, testInfo) => {
    const supplier = testInfo.project.use?.supplierContext;

    if (!supplier) {
      throw new Error(
        'supplierContext is missing. Run using a supplier project, e.g. --project=amadeus-user-one'
      );
    }

    const { provider, userKey } = supplier;
    const user = getUserFromConfig(provider, userKey);

    console.log(`Fixture: logging in as ${provider}.${userKey}`);
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });

    await App.loginAs(page, user);
    await use(page);
  },
});

module.exports = { test, expect: base.expect };