const base = require('@playwright/test');
const config = require('../../src/config/config');
const App = require('../../src/dsl/App');

/**
 * Reads a user (email + password) from config
 * based on provider and user key.
 *
 * Example:
 *   provider = "amadeus"
 *   userKey  = "user_one"
 */
function getUserFromConfig(provider, userKey) {
  const user = config.users?.[provider]?.[userKey];

  if (!user) {
    const availableUsers = Object.keys(config.users || {})
      .flatMap(p => Object.keys(config.users[p] || {}).map(u => `${p}.${u}`))
      .join(', ');

    throw new Error(
      `User "${provider}.${userKey}" not found in config.users. Available users: ${availableUsers}`
    );
  }

  return user;
}

/**
 * Shared helper that:
 * 1. Reads supplier info from the Playwright project
 * 2. Loads the correct user from config
 * 3. Navigates to the application
 * 4. Logs the user in
 */
async function loginWithSupplier({ page, testInfo }) {
  const supplier = testInfo.project.use?.supplierContext;

  if (!supplier) {
    throw new Error(
      'supplierContext is missing. Run the test using a supplier project, e.g. --project=flights:amadeus-user-one'
    );
  }

  const { provider, userKey } = supplier;
  const user = getUserFromConfig(provider, userKey);

  console.log(`Fixture: logging in as ${provider}.${userKey}`);

  await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
  await App.loginAs(page, user);

  return { provider, userKey };
}

/**
 * Custom test object with shared fixtures.
 *
 * Fixtures run automatically before each test
 * and prepare the application state.
 */
const test = base.test.extend({
  /**
   * Logs in and opens the "New Trip" flow.
   * Returns a page already positioned at the trip screen.
   */
  newTripPage: async ({ page }, use, testInfo) => {
    await loginWithSupplier({ page, testInfo });

    const tripPage = await App.bookANewTrip(page);
    await use(tripPage);
  },

  /**
   * Logs in only.
   * Returns a logged-in page without starting a new trip.
   */
  loggedInPage: async ({ page }, use, testInfo) => {
    await loginWithSupplier({ page, testInfo });
    await use(page);
  },
});

module.exports = {
  test,
  expect: base.expect,
};