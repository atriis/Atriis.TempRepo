const base = require('@playwright/test');
const config = require('@config/config');
const { App } = require('@dsl');

/*
 * =============================================================================
 * FIXTURE SELECTION GUIDE
 * =============================================================================
 *
 * Which fixture should I use?
 *
 *   What type of test is this?
 *   |
 *   +-- GENERAL test (tests/regression/[product]/general/)
 *   |   +-- Use: newTripPage
 *   |       User doesn't matter, runs with default supplier
 *   |
 *   +-- CROSS-SUPPLIER test (tests/regression/[product]/cross-supplier/)
 *   |   +-- Use: newTripPage
 *   |       Runs once per supplier, user selected automatically
 *   |
 *   +-- SUPPLIER-SPECIFIC test (tests/regression/[product]/gds/amadeus/, etc.)
 *       +-- Do different tests need different users?
 *           +-- NO  -> Use: newTripPage (simpler, uses user_one)
 *           +-- YES -> Use: newTripPageAs('user_key')
 *
 * -----------------------------------------------------------------------------
 * AVAILABLE FIXTURES
 * -----------------------------------------------------------------------------
 *
 *   Fixture         | Purpose                        | Returns
 *   ----------------|--------------------------------|---------------------------
 *   newTripPage     | Login + start new trip         | Page at trip screen
 *   loggedInPage    | Login only                     | Page at dashboard
 *   newTripPageAs   | Login as specific user + trip  | Function (call with key)
 *   loggedInPageAs  | Login as specific user only    | Function (call with key)
 *
 * -----------------------------------------------------------------------------
 * USAGE EXAMPLES
 * -----------------------------------------------------------------------------
 *
 *   // General or cross-supplier tests (most common)
 *   test('Book flight', async ({ newTripPage }) => {
 *     const page = newTripPage;
 *   });
 *
 *   // Supplier-specific tests with different users
 *   test('Approver flow', async ({ newTripPageAs }) => {
 *     const page = await newTripPageAs('user_two');
 *   });
 *
 * =============================================================================
 */

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
 * Extracts supplier context from the Playwright project.
 * Throws a clear error if missing.
 */
function getSupplierContext(testInfo) {
  const supplier = testInfo.project.use?.supplierContext;

  if (!supplier) {
    throw new Error(
      'supplierContext is missing. Run the test using a supplier project, e.g. --project=flights:amadeus'
    );
  }

  return supplier;
}

/**
 * Shared helper that:
 * 1. Reads supplier info from the Playwright project
 * 2. Loads the correct user from config (with optional override)
 * 3. Navigates to the application
 * 4. Logs the user in
 *
 * @param {Object} params
 * @param {Object} params.page - Playwright page instance
 * @param {Object} params.testInfo - Playwright testInfo object
 * @param {string} [params.userKeyOverride] - Optional user key to override project default
 */
async function loginWithSupplier({ page, testInfo, userKeyOverride }) {
  const supplier = getSupplierContext(testInfo);
  const { provider } = supplier;
  const userKey = userKeyOverride || supplier.userKey;
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
   * Uses the default user from the project's supplierContext.
   *
   * Returns a page already positioned at the trip screen.
   */
  newTripPage: async ({ page }, use, testInfo) => {
    await loginWithSupplier({ page, testInfo });

    const tripPage = await App.bookANewTrip(page);
    await use(tripPage);
  },

  /**
   * Logs in only (no new trip).
   * Uses the default user from the project's supplierContext.
   *
   * Returns a logged-in page without starting a new trip.
   */
  loggedInPage: async ({ page }, use, testInfo) => {
    await loginWithSupplier({ page, testInfo });
    await use(page);
  },

  /**
   * Factory fixture that allows tests to specify which user to log in as.
   * Used in supplier-specific tests where different tests need different users.
   *
   * Why this exists:
   * - Cross-supplier tests use one user per supplier (handled by project config)
   * - Supplier-specific tests may need to test with different users (user_one, user_two, etc.)
   * - This fixture lets the test choose which user to authenticate with
   *
   * Usage:
   *   test('Test with specific user', async ({ newTripPageAs }) => {
   *     const page = await newTripPageAs('user_two');
   *     // ... test logic using user_two
   *   });
   *
   *   test('Test with default user', async ({ newTripPageAs }) => {
   *     const page = await newTripPageAs(); // Uses project default (user_one)
   *     // ... test logic
   *   });
   */
  newTripPageAs: async ({ page }, use, testInfo) => {
    const loginAndStartTrip = async (userKeyOverride) => {
      await loginWithSupplier({ page, testInfo, userKeyOverride });
      const tripPage = await App.bookANewTrip(page);
      return tripPage;
    };

    await use(loginAndStartTrip);
  },

  /**
   * Factory fixture for login-only scenarios with user override.
   * Similar to newTripPageAs but does not start a new trip.
   *
   * Usage:
   *   test('Test logged in as specific user', async ({ loggedInPageAs }) => {
   *     const page = await loggedInPageAs('user_three');
   *     // ... test logic
   *   });
   */
  loggedInPageAs: async ({ page }, use, testInfo) => {
    const loginAsUser = async (userKeyOverride) => {
      await loginWithSupplier({ page, testInfo, userKeyOverride });
      return page;
    };

    await use(loginAsUser);
  },

  /**
   * Factory fixture for login + new trip with explicit provider and user key.
   *
   * Usage:
   *   test('Test with provider and user', async ({ newTripPageFor }) => {
   *     const page = await newTripPageFor('travelpolicy', 'user_one');
   *     // ... test logic
   *   });
   *
   * This fixture does not depend on Playwright project context.
   */
  newTripPageFor: async ({ page }, use, testInfo) => {
    const loginAndStartTrip = async (provider, userKey) => {
      const user = require('@config/config').users?.[provider]?.[userKey];
      if (!user) throw new Error(`User ${provider}.${userKey} not found in config`);
      await page.goto(require('@config/config').baseUrl, { waitUntil: 'domcontentloaded' });
      await require('@dsl/App').loginAs(page, user);
      const tripPage = await require('@dsl/App').bookANewTrip(page);
      return tripPage;
    };
    await use(loginAndStartTrip);
  },
});

module.exports = {
  test,
  expect: base.expect,
};