const { defineConfig } = require('@playwright/test');
const config = require('./src/config/config'); // loads dotenv + validates env vars

// Provider groups by capability
const providers = {
  gds: ['amadeus', 'sabre', 'galileo'],

  flightsNdc: [
    'afkl',
    'britishairways',
    'lufthansa',
    'united',
    'iberia',
    'americanairlines',
  ],

  flightsLowCost: ['galileoach', 'amadeuslightticketing', 'fusion', 'ypsilon'],

  rails: ['benerail', 'amtrak', 'evolvi'],

  hotels: ['expedia', 'bookingcom', 'ratehawk', 'ehotel', 'premierinn', 'travelodge'],

  cars: ['sunny'],

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
    testDir: `tests/regression/rails/${s.provider}`, // provider folder name must match
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

// Validate ALL provider groups (fail fast with clear message)
Object.entries(providers).forEach(([groupName, list]) => {
  assertProvidersExist(list, groupName);
});

// Auto-generate suppliers for each group
const suppliersByGroup = Object.fromEntries(
  Object.entries(providers).map(([groupName, list]) => [groupName, autoGenerateSuppliers(list)])
);

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
    // Smoke with default supplier
    {
      name: 'Smoke',
      testDir: 'tests/smoke',
      testMatch: '**/*.spec.js',
      use: { 
        channel: 'chrome',
        supplierContext: {
          provider: 'amadeus',
          userKey: 'user_one',
        },
      },
    },

    // Default supplier projects (for tests that don't need supplier matrix)
    {
      name: 'flights:default',
      testDir: 'tests/regression/flights/general',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'amadeus',
          userKey: 'user_one',
        },
      },
    },
    {
      name: 'hotels:default',
      testDir: 'tests/regression/hotels/general',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'ratehawk',
          userKey: 'user_one',
        },
      },
    },
    {
      name: 'cars:default',
      testDir: 'tests/regression/cars/general',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'sunny',
          userKey: 'user_one',
        },
      },
    },
    {
      name: 'rails:default',
      testDir: 'tests/regression/rails/general',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'benerail',
          userKey: 'user_one',
        },
      },
    },

    // Supplier-specific projects (for tests that only work with specific suppliers)
    {
      name: 'flights:amadeus',
      testDir: 'tests/regression/flights/amadeus',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'amadeus',
          userKey: 'user_one',
        },
      },
    },
    {
      name: 'flights:sabre',
      testDir: 'tests/regression/flights/sabre',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'sabre',
          userKey: 'user_one',
        },
      },
    },
    {
      name: 'hotels:ratehawk',
      testDir: 'tests/regression/hotels/ratehawk',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'ratehawk',
          userKey: 'user_one',
        },
      },
    },
    {
      name: 'cars:sabre',
      testDir: 'tests/regression/cars/sabre',
      testMatch: '**/*.spec.js',
      use: {
        channel: 'chrome',
        supplierContext: {
          provider: 'sabre',
          userKey: 'user_one',
        },
      },
    },

    // Flights (GDS) - general tests that run across all suppliers
    ...createProjectsForProduct({
      product: 'flights',
      testDir: 'tests/regression/flights/general',
      suppliers: suppliersByGroup.gds,
    }),

    // Hotels - general tests that run across all suppliers  
    ...createProjectsForProduct({
      product: 'hotels',
      testDir: 'tests/regression/hotels/general',
      suppliers: suppliersByGroup.hotels,
    }),

    // Cars - general tests that run across all suppliers
    ...createProjectsForProduct({
      product: 'cars',
      testDir: 'tests/regression/cars/general',
      suppliers: suppliersByGroup.cars,
    }),

    // Ground Transport
    ...createProjectsForProduct({
      product: 'ground',
      testDir: 'tests/regression/ground-transport',
      suppliers: suppliersByGroup.groundTransport,
    }),

    // Parking
    ...createProjectsForProduct({
      product: 'parking',
      testDir: 'tests/regression/parking',
      suppliers: suppliersByGroup.parking,
    }),

    // Rails (supplier-specific folders)
    ...createRailProjects({ suppliers: suppliersByGroup.rails }),
  ],
});