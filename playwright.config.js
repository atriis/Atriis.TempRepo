const { defineConfig } = require('@playwright/test');
const config = require('./src/config/config');
// Loads environment variables and validates them at startup

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

function slugify(str) {
  return String(str).trim().toLowerCase().replace(/_/g, '-');
}

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

function autoGenerateSuppliers(providerList) {
  return providerList.flatMap(provider => {
    const userKeys = Object.keys(config.users?.[provider] || {});
    return userKeys.map(userKey => ({
      provider,
      userKey,
      name: `${provider}-${slugify(userKey)}`,
    }));
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

function createRailProjects({ suppliers }) {
  return suppliers.map(s => ({
    name: `rails:${s.name}`,
    testDir: `tests/regression/rails/${s.provider}`,
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

const suppliersByGroup = Object.fromEntries(
  Object.entries(providers).map(([groupName, list]) => [
    groupName,
    autoGenerateSuppliers(list),
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
  timeout: 300000,
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
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

    ...createProjectsForProduct({
      product: 'flights-cross-supplier',
      testDir: 'tests/regression/flights/cross-supplier',
      suppliers: suppliersByGroup.flightsAll,
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

    ...createProjectsForProduct({
      product: 'hotels-cross-supplier',
      testDir: 'tests/regression/hotels/cross-supplier',
      suppliers: suppliersByGroup.hotelsAll,
    }),

    defaultProject({
      name: 'cars:default',
      testDir: 'tests/regression/cars/general',
      provider: 'sunny',
    }),

    ...createProjectsForProduct({
      product: 'cars-cross-supplier',
      testDir: 'tests/regression/cars/cross-supplier',
      suppliers: suppliersByGroup.carsAll,
    }),
  ],
});