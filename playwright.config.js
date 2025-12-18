const { defineConfig } = require('@playwright/test');
const config = require('./src/config/config'); 
// Loads environment variables and validates them at startup

/**
 * Providers grouped by product capability.
 * Each provider must exist in config.users (validated below).
 */
const providers = {
  // Core GDS suppliers (shared across flights, hotels and cars)
  gds: ['amadeus', 'sabre', 'galileo'],

  // Flight-specific supplier groups
  flightsNdc: [
    'afkl',
    'british',
    'lufthansa',
    'united',
    'iberia',
    'american',
  ],

  flightsLowCost: ['galileoach', 'amadeuslightticketing', 'fusion', 'ypsilon'],

  // All flight suppliers (for comprehensive flight testing)
  flightsAll: [
    'amadeus', 'sabre', 'galileo', // GDS
    'afkl', 'british', 'lufthansa', 'united', 'iberia', 'american', // NDC
    'galileoach', 'amadeuslightticketing', 'fusion', 'ypsilon' // LCC
  ],

  // Hotel suppliers
  hotels: ['expedia', 'bookingcom', 'ratehawk', 'ehotel', 'premierinn', 'travelodge'],
  
  // Hotel suppliers including GDS
  hotelsAll: ['amadeus', 'sabre', 'galileo', 'expedia', 'bookingcom', 'ratehawk', 'ehotel', 'premierinn', 'travelodge'],

  // Car suppliers  
  cars: ['sunny'],
  
  // Car suppliers including GDS
  carsAll: ['amadeus', 'sabre', 'galileo', 'sunny'],

  // Rail suppliers
  rails: ['benerail', 'amtrak', 'evolvi'],

  // Ground transportation
  groundTransport: ['groundscope', 'transferz'],

  // Parking
  parking: ['ukparking'],
};

/**
 * Converts strings like "USER_ONE" into "user-one"
 * Used only to create readable Playwright project names.
 */
function slugify(str) {
  return String(str).trim().toLowerCase().replace(/_/g, '-');
}

/**
 * Ensures that every provider declared above
 * has at least one user configured in config.users.
 * 
 * This makes the test suite fail fast with a clear error
 * instead of failing later during execution.
 */
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
 * For each provider, generate one entry per user.
 * Example:
 *   amadeus + user_one
 *   amadeus + user_two
 */
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

/**
 * Creates Playwright projects for products that share the same folder.
 * Each supplier runs the same tests independently.
 */
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

/**
 * Rails tests are stored in supplier-specific folders,
 * so the test directory depends on the provider name.
 */
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

// Validate provider configuration before running any test
Object.entries(providers).forEach(([groupName, list]) => {
  assertProvidersExist(list, groupName);
});

// Generate supplier + user combinations for each group
const suppliersByGroup = Object.fromEntries(
  Object.entries(providers).map(([groupName, list]) => [
    groupName,
    autoGenerateSuppliers(list),
  ])
);

/**
 * Helper for "default supplier" projects.
 * These tests run once with a known, stable provider.
 */
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

/**
 * Create projects for supplier groups (e.g., just GDS, just NDC)
 */
function createProjectsForSupplierGroup({ groupName, testDir, suppliers, productPrefix = '' }) {
  return suppliers.map(s => ({
    name: productPrefix ? `${productPrefix}:${groupName}:${s.name}` : `${groupName}:${s.name}`,
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

  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Smoke tests (single stable supplier)
    defaultProject({
      name: 'Smoke',
      testDir: 'tests/smoke',
      provider: 'amadeus',
    }),

    // ========== FLIGHTS ==========
    // General folder: default supplier (don't care about supplier)
    defaultProject({
      name: 'flights:default',
      testDir: 'tests/regression/flights/general',
      provider: 'amadeus',
    }),

    // Cross-supplier folder: tests for ALL flight suppliers
    ...createProjectsForProduct({
      product: 'flights-cross-supplier',
      testDir: 'tests/regression/flights/cross-supplier',
      suppliers: suppliersByGroup.flightsAll,
    }),

    // GDS folder: specific for each GDS 
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

    // NDC folders: specific for each NDC
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

    // LCC folders: specific for each LCC
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

    // ========== HOTELS ==========
    // General folder: default supplier (don't care about supplier)
    defaultProject({
      name: 'hotels:default',
      testDir: 'tests/regression/hotels/general',
      provider: 'ratehawk',
    }),

    // Cross-supplier folder: tests for ALL hotel suppliers
    ...createProjectsForProduct({
      product: 'hotels-cross-supplier',
      testDir: 'tests/regression/hotels/cross-supplier',
      suppliers: suppliersByGroup.hotelsAll,
    }),

    // GDS folder: specific for each GDS 
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

    // Hotel-specific supplier folders
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

    // ========== CARS ==========
    // General folder: default supplier (don't care about supplier)
    defaultProject({
      name: 'cars:default',
      testDir: 'tests/regression/cars/general',
      provider: 'sunny',
    }),

    // Cross-supplier folder: tests for ALL car suppliers
    ...createProjectsForProduct({
      product: 'cars-cross-supplier',
      testDir: 'tests/regression/cars/cross-supplier',
      suppliers: suppliersByGroup.carsAll,
    }),

    // GDS folder: specific for each GDS
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

    // Sunny folder: specific to Sunny Cars
    defaultProject({
      name: 'cars:sunny',
      testDir: 'tests/regression/cars/sunny',
      provider: 'sunny',
    }),

    // ========== RAILS ==========
    // General folder: default supplier (don't care about supplier)
    defaultProject({
      name: 'rails:default',
      testDir: 'tests/regression/rails/general',
      provider: 'benerail',
    }),

    // Cross-supplier folder: tests for ALL rail suppliers
    ...createProjectsForProduct({
      product: 'rails-cross-supplier',
      testDir: 'tests/regression/rails/cross-supplier',
      suppliers: suppliersByGroup.rails,
    }),

    // Rail-specific supplier folders
    defaultProject({
      name: 'rails:amtrak',
      testDir: 'tests/regression/rails/amtrak',
      provider: 'amtrak',
    }),
    defaultProject({
      name: 'rails:benerail',
      testDir: 'tests/regression/rails/benerail',
      provider: 'benerail',
    }),
    defaultProject({
      name: 'rails:evolvi',
      testDir: 'tests/regression/rails/evolvi',
      provider: 'evolvi',
    }),

    // ========== GROUND TRANSPORTATION ==========
    // General folder: default supplier (don't care about supplier)
    defaultProject({
      name: 'ground:default',
      testDir: 'tests/regression/ground-transportation/general',
      provider: 'groundscope',
    }),

    // Cross-supplier folder: tests for ALL ground transport suppliers
    ...createProjectsForProduct({
      product: 'ground-cross-supplier',
      testDir: 'tests/regression/ground-transportation/cross-supplier',
      suppliers: suppliersByGroup.groundTransport,
    }),

    // Ground transport specific supplier folders
    defaultProject({
      name: 'ground:groundscope',
      testDir: 'tests/regression/ground-transportation/groundscope',
      provider: 'groundscope',
    }),
    defaultProject({
      name: 'ground:transferz',
      testDir: 'tests/regression/ground-transportation/transferz',
      provider: 'transferz',
    }),

    // ========== PARKING ==========
    // Parking-specific supplier folder
    defaultProject({
      name: 'parking:ukparking',
      testDir: 'tests/regression/parking/ukparking',
      provider: 'ukparking',
    }),
  ],
});