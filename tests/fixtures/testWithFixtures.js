const base = require('@playwright/test');
const config = require('../../src/config/config');
const App = require('../../src/dsl/App');

// --- Optional: allow both userOne and user_one ---
function normalizeUserKey(userKey) {
  const map = { userOne: 'user_one', userTwo: 'user_two' };
  return map[userKey] || userKey;
}

// Helper to parse user string (e.g., "amadeus.user_one" OR "amadeus.userOne")
function getUser(userString) {
  const [provider, rawKey] = userString.split('.');
  const userKey = normalizeUserKey(rawKey); // remove this line if you want strictly `user_one`
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

// Defensive guard for baseUrl
function assertValidUrl(url) {
  try {
    const u = new URL(url);
    if (!u.protocol.startsWith('http')) throw new Error('Unsupported protocol');
  } catch (e) {
    throw new Error(`config.baseUrl is not a valid http(s) URL: "${url}". Original error: ${e.message}`);
  }
}

// Create test function with user parameter
function createTestWithUser(userString) {
  const user = getUser(userString);
  const testName = userString.toUpperCase().replace('.', '_');

  // Validate once per fixture creation
  assertValidUrl(config.baseUrl);

  return base.test.extend({
    [`newTripPage${testName}`]: async ({ page }, use) => {
      console.log(`Fixture: logging in as ${userString} and opening new trip`);
      await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
      await App.loginAs(page, user);
      const tripPage = await App.bookANewTrip(page);
      await use(tripPage);
    },

    [`loggedInPage${testName}`]: async ({ page }, use) => {
      console.log(`Fixture: logging in as ${userString}`);
      await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
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

  // Benerail users
  benerailUserOneTest: createTestWithUser('benerail.user_one'),

  test: base.test,
  expect: base.expect,
};
