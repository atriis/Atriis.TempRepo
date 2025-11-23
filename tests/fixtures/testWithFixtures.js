const base = require('@playwright/test');
const config = require('../../src/config/config');
const App = require('../../src/dsl/App');

// Helper to parse user string (e.g., "amadeus.userOne")
function getUser(userString) {
  const [provider, userKey] = userString.split('.');
  const user = config.users[provider]?.[userKey];
  
  if (!user) {
    const availableUsers = Object.keys(config.users)
      .map(p => Object.keys(config.users[p]).map(u => `${p}.${u}`))
      .flat()
      .join(', ');
    throw new Error(`User "${userString}" not found in config. Available: ${availableUsers}`);
  }
  
  return user;
}

// Create test function with user parameter
function createTestWithUser(userString) {
  const user = getUser(userString);
  const testName = userString.toUpperCase().replace('.', '_');
  
  return base.test.extend({
    [`newTripPage${testName}`]: async ({ page }, use) => {
      console.log(`Fixture: logging in as ${userString} and opening new trip`);
      await page.goto(config.baseUrl);
      await App.loginAs(page, user);
      const tripPage = await App.bookANewTrip(page);
      await use(tripPage);
    },

    [`loggedInPage${testName}`]: async ({ page }, use) => {
      console.log(`Fixture: logging in as ${userString}`);
      await page.goto(config.baseUrl);
      await App.loginAs(page, user);
      await use(page);
    },
  });
}

// Export test functions for each user
module.exports = {
  // Amadeus users
  amadeusUserOneTest: createTestWithUser('amadeus.user_one'),
  amadeusUserTwoTest: createTestWithUser('amadeus.user_two'),
  
  // Ratehawk users  
  ratehawkUserOneTest: createTestWithUser('ratehawk.user_one'),
  
  // Sabre users
  sabreUserOneTest: createTestWithUser('sabre.user_one'),
  
  test: base.test,
  expect: base.expect,
};
