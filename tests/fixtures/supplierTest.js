const base = require("@playwright/test");
const config = require("@config/config");
const { App } = require("@dsl");

/*
 * =============================================================================
 * FIXTURE SELECTION GUIDE
 * =============================================================================
 *
 * This framework has TWO fixture patterns only:
 *
 * 1. CROSS-SUPPLIER tests (tests run once per supplier in a group)
 *    Use: newTripPage
 *    The supplier is determined by the Playwright project configuration.
 *
 *    Example:
 *      test('Book flight', async ({ newTripPage }) => {
 *        const page = newTripPage;
 *        // Test runs for each supplier in the project group
 *      });
 *
 * 2. SPECIFIC USER tests (explicit provider and user)
 *    Use: newTripPageFor(provider, userKey)
 *    You specify exactly which provider and user to use.
 *
 *    Example:
 *      test('Travel policy test', async ({ newTripPageFor }) => {
 *        const page = await newTripPageFor('travelpolicy', 'user_one');
 *        // Test runs with exact user specified
 *      });
 *
 * =============================================================================
 */

/**
 * Reads a user (email + password) from config
 * based on provider and user key.
 */
function getUserFromConfig(provider, userKey) {
  const user = config.users?.[provider]?.[userKey];

  if (!user) {
    const availableUsers = Object.keys(config.users || {})
      .flatMap(p => Object.keys(config.users[p] || {}).map(u => `${p}.${u}`))
      .join(", ");

    throw new Error(
      `User "${provider}.${userKey}" not found in config.users. Available users: ${availableUsers}`,
    );
  }

  return user;
}

/**
 * Extracts supplier context from the Playwright project.
 * Returns null if not configured (for explicit user tests).
 */
function getSupplierContext(testInfo) {
  return testInfo.project.use?.supplierContext || null;
}

/**
 * Custom test object with simplified fixtures.
 *
 * Only two fixture patterns:
 * - newTripPage: for cross-supplier tests (uses project context)
 * - newTripPageFor: for specific user tests (explicit provider + user)
 */
const test = base.test.extend({
  /**
   * CROSS-SUPPLIER FIXTURE
   *
   * Logs in and opens "New Trip" using the project's supplier context.
   * The supplier is determined by the Playwright project configuration.
   *
   * Usage:
   *   test('Book flight', async ({ newTripPage }) => {
   *     const page = newTripPage;
   *   });
   */
  newTripPage: async ({ page }, use, testInfo) => {
    const supplier = getSupplierContext(testInfo);

    if (!supplier) {
      throw new Error(
        "newTripPage requires a project with supplierContext. " +
        "Use newTripPageFor(provider, userKey) for specific user tests, " +
        "or run with a cross-supplier project.",
      );
    }

    const { provider, userKey } = supplier;
    const user = getUserFromConfig(provider, userKey);

    console.log(`Fixture: logging in as ${provider}.${userKey}`);

    await page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
    await App.loginAs(page, user);

    const tripPage = await App.bookANewTrip(page);
    await use(tripPage);
  },

  /**
   * SPECIFIC USER FIXTURE
   *
   * Logs in and opens "New Trip" with explicit provider and user key.
   * Does not depend on Playwright project configuration.
   *
   * Usage:
   *   test('Travel policy test', async ({ newTripPageFor }) => {
   *     const page = await newTripPageFor('travelpolicy', 'user_one');
   *   });
   */
  newTripPageFor: async ({ page }, use) => {
    const loginAndStartTrip = async (provider, userKey) => {
      const user = getUserFromConfig(provider, userKey);

      console.log(`Fixture: logging in as ${provider}.${userKey}`);

      await page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
      await App.loginAs(page, user);

      const tripPage = await App.bookANewTrip(page);
      return tripPage;
    };

    await use(loginAndStartTrip);
  },
});

module.exports = {
  test,
  expect: base.expect,
};
