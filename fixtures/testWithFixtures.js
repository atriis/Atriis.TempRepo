// fixtures/testWithFixtures.js
const base = require('@playwright/test');
const config = require('../test-data/config');
const App = require('../dsl/App');

// Extend the base Playwright test with our own fixtures
const test = base.test.extend({
  /**
   * loggedInPage fixture
   * - Creates a new page (Playwright does that)
   * - Navigates to baseUrl
   * - Logs in using App.loginAs + env-based user
   * - Gives the logged-in page to the test
   */
  loggedInPage: async ({ page }, use) => {
    console.log('Fixture: logging in as amadeusUserOne');

    await page.goto(config.baseUrl);
    await App.loginAs(page, config.users.amadeusUserOne);

    // Hand the prepared page to the test
    await use(page);
    // Page/context cleanup is handled automatically by Playwright after the test
  },

  /**
   * newTripPage fixture
   * - Starts from a logged-in page
   * - Clicks "Book a New Trip" (via your DSL)
   * - Waits for and returns the new tab Page
   */
  newTripPage: async ({ loggedInPage }, use) => {
    console.log('Fixture: opening Book a New Trip and switching to second tab');

    // App.bookANewTrip should return the Page for the new tab
    const tripPage = await App.bookANewTrip(loggedInPage);

    await use(tripPage);
    // Cleanup again is automatic after the test finishes
  },
});

module.exports = {
  test,
  expect: base.expect,
};
