const { defineConfig } = require('@playwright/test');
const config = require('./src/config/config');
require('module-alias/register');

/**
 * Viewport presets for local flexibility.
 * Default = desktopFullHD (1920x1080)
 */
const viewportPresets = {
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1440, height: 900 },
  desktopFullHD: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

const ACTIVE_VIEWPORT =
  viewportPresets[process.env.VIEWPORT] ||
  viewportPresets.desktopFullHD;

/**
 * Providers grouped by product capability.
 * Each provider must exist in config.users (validated below).
 */
const providers = {
  gds: ['amadeus', 'sabre', 'galileo'],

  flightsNdc: [
    'afkl',
    'british',
    'lufthansa',
    'united',
    'iberia',
    'american',
  ],

  flightsLowCost: ['galileoach', 'amadeuslightticketing', 'fusion', 'ypsilon'],

  flightsAll: [
    'amadeus', 'sabre', 'galileo',
    'afkl', 'british', 'lufthansa', 'united', 'iberia', 'american',
    'galileoach', 'amadeuslightticketing', 'fusion', 'ypsilon'
  ],

  hotels: ['expedia', 'bookingcom', 'ratehawk', 'ehotel', 'premierinn', 'travelodge'],

  hotelsAll: [
    'amadeus', 'sabre', 'galileo',
    'expedia', 'bookingcom', 'ratehawk', 'ehotel', 'premierinn', 'travelodge'
  ],

  cars: ['sunny'],
  carsAll: ['amadeus', 'sabre', 'galileo', 'sunny'],

  rails: ['benerail', 'amtrak', 'evolvi'],
  groundTransport: ['groundscope', 'transferz'],
  parking: ['ukparking'],
};

function assertProvidersExist(providerList, groupName) {
  const missing = providerList.filter(p => !config.users?.[p]);
  if (missing.length === 0) return;

  const available = Object.keys(config.users || {}).join(', ');
  throw new Error(
    `[playwright.config] Missing providers in config.users for "${groupName}": ${missing.join(
      ', '
    )}. Available providers: ${available}`
  );
}

/**
 * Generates one project per supplier using only the first available user.
 * Used for cross-supplier tests where we need coverage across suppliers,
 * not across multiple users within the same supplier.
 *
 * Example output for ['amadeus', 'sabre']:
 *   [{ provider: 'amadeus', userKey: 'user_one', name: 'amadeus' },
 *    { provider: 'sabre', userKey: 'user_one', name: 'sabre' }]
 */
function autoGenerateSuppliersOneUserEach(providerList) {
  return providerList.map(provider => {
    const userKeys = Object.keys(config.users?.[provider] || {});
    const firstUserKey = userKeys[0] || 'user_one';
    return {
      provider,
      userKey: firstUserKey,
      name: provider,
    };
  });
}

function createProjectsForProduct({ product, testDir, suppliers }) {
  return suppliers.map(s => ({
    name: `${product}:${s.name}`,
    testDir,
    testMatch: '**/*.spec.js',
    use: {
      channel: 'chrome',
      supplierContext: {
        provider: s.provider,
        userKey: s.userKey,
      },
    },
  }));
}

Object.entries(providers).forEach(([groupName, list]) => {
  assertProvidersExist(list, groupName);
});

// One user per supplier (for cross-supplier tests)
const suppliersOneUserByGroup = Object.fromEntries(
  Object.entries(providers).map(([groupName, list]) => [
    groupName,
    autoGenerateSuppliersOneUserEach(list),
  ])
);

function defaultProject({ name, testDir, provider }) {
  return {
    name,
    testDir,
    testMatch: '**/*.spec.js',
    use: {
      channel: 'chrome',
      supplierContext: {
        provider,
        userKey: 'user_one',
      },
    },
  };
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 60000, // expect timeout
  },
  workers: process.env.CI ? 2 : 4,

reporter: [
  ['junit', { outputFile: 'test-results/results.xml' }],
  ['html', { open: 'never' }]
],

  /**
   * Screen + viewport are flexible via ENV
   */
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    viewport: ACTIVE_VIEWPORT,
    screen: ACTIVE_VIEWPORT,
    ignoreHTTPSErrors: true,
  },

  projects: [
    defaultProject({
      name: 'Smoke',
      testDir: 'tests/smoke',
      provider: 'amadeus',
    }),

    defaultProject({
      name: 'flights:default',
      testDir: 'tests/regression/flights/general',
      provider: 'amadeus',
    }),

    // Cross-supplier: one user per supplier
    ...createProjectsForProduct({
      product: 'flights-cross-supplier',
      testDir: 'tests/regression/flights/cross-supplier',
      suppliers: suppliersOneUserByGroup.flightsAll,
    }),

    defaultProject({
      name: 'flights:amadeus',
      testDir: 'tests/regression/flights/gds/amadeus',
      provider: 'amadeus',
    }),

    defaultProject({
      name: 'flights:sabre',
      testDir: 'tests/regression/flights/gds/sabre',
      provider: 'sabre',
    }),

    defaultProject({
      name: 'flights:galileo',
      testDir: 'tests/regression/flights/gds/galileo',
      provider: 'galileo',
    }),

    defaultProject({
      name: 'flights:afkl',
      testDir: 'tests/regression/flights/ndc/afkl',
      provider: 'afkl',
    }),

    defaultProject({
      name: 'flights:british',
      testDir: 'tests/regression/flights/ndc/british',
      provider: 'british',
    }),

    defaultProject({
      name: 'flights:lufthansa',
      testDir: 'tests/regression/flights/ndc/lufthansa',
      provider: 'lufthansa',
    }),

    defaultProject({
      name: 'flights:united',
      testDir: 'tests/regression/flights/ndc/united',
      provider: 'united',
    }),

    defaultProject({
      name: 'flights:iberia',
      testDir: 'tests/regression/flights/ndc/iberia',
      provider: 'iberia',
    }),

    defaultProject({
      name: 'flights:american',
      testDir: 'tests/regression/flights/ndc/american',
      provider: 'american',
    }),

    defaultProject({
      name: 'flights:fusion',
      testDir: 'tests/regression/flights/lcc/fusion',
      provider: 'fusion',
    }),

    defaultProject({
      name: 'flights:ypsilon',
      testDir: 'tests/regression/flights/lcc/ypsilon',
      provider: 'ypsilon',
    }),

    defaultProject({
      name: 'hotels:default',
      testDir: 'tests/regression/hotels/general',
      provider: 'ratehawk',
    }),

    defaultProject({
      name: 'hotels:amadeus',
      testDir: 'tests/regression/hotels/gds/amadeus',
      provider: 'amadeus',
    }),

    defaultProject({
      name: 'hotels:sabre',
      testDir: 'tests/regression/hotels/gds/sabre',
      provider: 'sabre',
    }),

    defaultProject({
      name: 'hotels:galileo',
      testDir: 'tests/regression/hotels/gds/galileo',
      provider: 'galileo',
    }),

    // Cross-supplier: one user per supplier
    ...createProjectsForProduct({
      product: 'hotels-cross-supplier',
      testDir: 'tests/regression/hotels/cross-supplier',
      suppliers: suppliersOneUserByGroup.hotelsAll,
    }),

    defaultProject({
      name: 'hotels:expedia',
      testDir: 'tests/regression/hotels/expedia',
      provider: 'expedia',
    }),

    defaultProject({
      name: 'hotels:bookingcom',
      testDir: 'tests/regression/hotels/booking-com',
      provider: 'bookingcom',
    }),

    defaultProject({
      name: 'hotels:ratehawk',
      testDir: 'tests/regression/hotels/ratehawk',
      provider: 'ratehawk',
    }),

    defaultProject({
      name: 'hotels:ehotel',
      testDir: 'tests/regression/hotels/ehotel',
      provider: 'ehotel',
    }),

    defaultProject({
      name: 'hotels:premierinn',
      testDir: 'tests/regression/hotels/premier-inn',
      provider: 'premierinn',
    }),

    defaultProject({
      name: 'hotels:travelodge',
      testDir: 'tests/regression/hotels/travelodge',
      provider: 'travelodge',
    }),

    defaultProject({
      name: 'cars:default',
      testDir: 'tests/regression/cars/general',
      provider: 'sunny',
    }),

    // Cross-supplier: one user per supplier
    ...createProjectsForProduct({
      product: 'cars-cross-supplier',
      testDir: 'tests/regression/cars/cross-supplier',
      suppliers: suppliersOneUserByGroup.carsAll,
    }),

    defaultProject({
      name: 'cars:amadeus',
      testDir: 'tests/regression/cars/gds/amadeus',
      provider: 'amadeus',
    }),

    defaultProject({
      name: 'cars:sabre',
      testDir: 'tests/regression/cars/gds/sabre',
      provider: 'sabre',
    }),

    defaultProject({
      name: 'cars:galileo',
      testDir: 'tests/regression/cars/gds/galileo',
      provider: 'galileo',
    }),

    defaultProject({
      name: 'cars:sunny',
      testDir: 'tests/regression/cars/sunny',
      provider: 'sunny',
    }),

    defaultProject({
      name: 'rails:benerail',
      testDir: 'tests/regression/rails/benerail',
      provider: 'benerail',
    }),

    defaultProject({
      name: 'rails:amtrak',
      testDir: 'tests/regression/rails/amtrak',
      provider: 'amtrak',
    }),

    defaultProject({
      name: 'rails:evolvi',
      testDir: 'tests/regression/rails/evolvi',
      provider: 'evolvi',
    }),

    defaultProject({
      name: 'groundtransport:groundscope',
      testDir: 'tests/regression/ground-transportation/groundscope',
      provider: 'groundscope',
    }),

    defaultProject({
      name: 'groundtransport:transferz',
      testDir: 'tests/regression/ground-transportation/transferz',
      provider: 'transferz',
    }),

    // Cross-supplier: one user per supplier
    ...createProjectsForProduct({
      product: 'groundtransport-cross-supplier',
      testDir: 'tests/regression/ground-transportation/cross-supplier',
      suppliers: suppliersOneUserByGroup.groundTransport,
    }),

    defaultProject({
      name: 'parking:ukparking',
      testDir: 'tests/regression/parking',
      provider: 'ukparking',
    }),
  ],
});