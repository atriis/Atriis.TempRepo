const { defineConfig } = require('@playwright/test');
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

/*
 * =============================================================================
 * SUPPLIER GROUPS
 * =============================================================================
 * Define supplier groups for cross-supplier testing.
 */
const supplierGroups = {
  // GDS suppliers (shared across all products)
  gds: ['amadeus', 'sabre', 'galileo'],

  // Flights - non-GDS suppliers
  flightsNonGds: [
    'afkl', 'british', 'lufthansa', 'united', 'iberia', 'american',
    'fusion', 'ypsilon',
  ],

  // Hotels - non-GDS suppliers
  hotelsNonGds: ['expedia', 'bookingcom', 'ratehawk', 'ehotel', 'premierinn', 'travelodge'],

  // Cars - non-GDS suppliers
  carsNonGds: ['sunny'],

  //Cars - all suppliers 
  carsAll: ['amadeus', 'sabre', 'galileo', 'sunny'],

  // Rails - all suppliers
  railsAll: ['benerail', 'amtrak', 'evolvi'],

  // Ground Transport - all suppliers
  groundTransportAll: ['groundscope', 'transferz'],
};

/**
 * Creates cross-supplier projects for a test directory.
 * Each supplier in the group gets its own project running the same tests.
 *
 * @param {string} projectPrefix - Project name prefix (e.g., 'flights-x-gds')
 * @param {string} testDir - Test directory path
 * @param {string[]} suppliers - Array of supplier names
 */
function createCrossSupplierProjects(projectPrefix, testDir, suppliers) {
  return suppliers.map(provider => ({
    name: `${projectPrefix}:${provider}`,
    testDir,
    testMatch: '**/*.spec.js',
    use: {
      channel: 'chrome',
      supplierContext: {
        provider,
        userKey: 'user_one',
      },
    },
  }));
}

/**
 * Creates a project for tests using newTripPageFor (explicit user selection).
 * No supplierContext - tests specify provider/user explicitly.
 *
 * @param {string} name - Project name
 * @param {string} testDir - Test directory path
 */
function createSpecificUserProject(name, testDir) {
  return {
    name,
    testDir,
    testMatch: '**/*.spec.js',
    use: {
      channel: 'chrome',
    },
  };
}

module.exports = defineConfig({
  retries: process.env.CI ? 2 : 0,
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 60000,
  },
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['html', { open: 'never' }]
  ],

  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: ACTIVE_VIEWPORT,
    screen: ACTIVE_VIEWPORT,
    ignoreHTTPSErrors: true,
  },

  projects: [
    /*
     * =========================================================================
     * SMOKE TESTS
     * =========================================================================
     */
    createSpecificUserProject('smoke', 'tests/smoke'),

    /*
     * =========================================================================
     * FLIGHTS - Provider-Specific Tests (use newTripPageFor)
     * =========================================================================
     */
    createSpecificUserProject('flights:amadeus', 'tests/regression/flights/amadeus'),
    createSpecificUserProject('flights:sabre', 'tests/regression/flights/sabre'),
    createSpecificUserProject('flights:galileo', 'tests/regression/flights/galileo'),
    createSpecificUserProject('flights:afkl', 'tests/regression/flights/afkl'),
    createSpecificUserProject('flights:british', 'tests/regression/flights/british'),
    createSpecificUserProject('flights:lufthansa', 'tests/regression/flights/lufthansa'),
    createSpecificUserProject('flights:united', 'tests/regression/flights/united'),
    createSpecificUserProject('flights:iberia', 'tests/regression/flights/iberia'),
    createSpecificUserProject('flights:american', 'tests/regression/flights/american'),
    createSpecificUserProject('flights:fusion', 'tests/regression/flights/fusion'),
    createSpecificUserProject('flights:ypsilon', 'tests/regression/flights/ypsilon'),
    createSpecificUserProject('flights:general', 'tests/regression/flights/general'),

    // Flights - Cross-Supplier GDS (amadeus, sabre, galileo)
    ...createCrossSupplierProjects('flights-cross-gds', 'tests/regression/flights/cross-supplier-gds', supplierGroups.gds),

    // Flights - Cross-Supplier Non-GDS
    ...createCrossSupplierProjects('flights-cross-nongds', 'tests/regression/flights/cross-supplier-nongds', supplierGroups.flightsNonGds),

    /*
     * =========================================================================
     * HOTELS - Provider-Specific Tests (use newTripPageFor)
     * =========================================================================
     */
    createSpecificUserProject('hotels:amadeus', 'tests/regression/hotels/amadeus'),
    createSpecificUserProject('hotels:sabre', 'tests/regression/hotels/sabre'),
    createSpecificUserProject('hotels:galileo', 'tests/regression/hotels/galileo'),
    createSpecificUserProject('hotels:expedia', 'tests/regression/hotels/expedia'),
    createSpecificUserProject('hotels:bookingcom', 'tests/regression/hotels/booking-com'),
    createSpecificUserProject('hotels:ratehawk', 'tests/regression/hotels/ratehawk'),
    createSpecificUserProject('hotels:ehotel', 'tests/regression/hotels/ehotel'),
    createSpecificUserProject('hotels:premierinn', 'tests/regression/hotels/premier-inn'),
    createSpecificUserProject('hotels:travelodge', 'tests/regression/hotels/travelodge'),
    createSpecificUserProject('hotels:general', 'tests/regression/hotels/general'),

    // Hotels - Cross-Supplier GDS (amadeus, sabre, galileo)
    ...createCrossSupplierProjects('hotels-cross-gds', 'tests/regression/hotels/cross-supplier-gds', supplierGroups.gds),

    // Hotels - Cross-Supplier Non-GDS
    ...createCrossSupplierProjects('hotels-cross-nongds', 'tests/regression/hotels/cross-supplier-nongds', supplierGroups.hotelsNonGds),

    /*
     * =========================================================================
     * CARS - Provider-Specific Tests (use newTripPageFor)
     * =========================================================================
     */
    createSpecificUserProject('cars:amadeus', 'tests/regression/cars/amadeus'),
    createSpecificUserProject('cars:sabre', 'tests/regression/cars/sabre'),
    createSpecificUserProject('cars:galileo', 'tests/regression/cars/galileo'),
    createSpecificUserProject('cars:sunny', 'tests/regression/cars/sunny'),
    createSpecificUserProject('cars:general', 'tests/regression/cars/general'),

    // Cars - Cross-Supplier GDS (amadeus, sabre, galileo) and Non-GDS (sunny)
    ...createCrossSupplierProjects('cars-cross-supplier', 'tests/regression/cars/cross-supplier', supplierGroups.carsAll),

    /*
     * =========================================================================
     * RAILS - Provider-Specific Tests (use newTripPageFor)
     * =========================================================================
     */
    createSpecificUserProject('rails:amtrak', 'tests/regression/rails/amtrak'),
    createSpecificUserProject('rails:benerail', 'tests/regression/rails/benerail'),
    createSpecificUserProject('rails:evolvi', 'tests/regression/rails/evolvi'),
    createSpecificUserProject('rails:general', 'tests/regression/rails/general'),

    // Rails - Cross-Supplier ALL
    ...createCrossSupplierProjects('rails-cross', 'tests/regression/rails/cross-supplier', supplierGroups.railsAll),

    /*
     * =========================================================================
     * GROUND TRANSPORT - Provider-Specific Tests (use newTripPageFor)
     * =========================================================================
     */
    createSpecificUserProject('ground:groundscope', 'tests/regression/ground-transportation/groundscope'),
    createSpecificUserProject('ground:transferz', 'tests/regression/ground-transportation/transferz'),

    // Ground Transport - Cross-Supplier ALL
    ...createCrossSupplierProjects('ground-cross', 'tests/regression/ground-transportation/cross-supplier', supplierGroups.groundTransportAll),

    /*
     * =========================================================================
     * OTHER - Specific User Tests (use newTripPageFor)
     * =========================================================================
     */
    createSpecificUserProject('travel-policy', 'tests/regression/travel-policy'),
    createSpecificUserProject('manual-quote', 'tests/regression/manual-quote'),
    createSpecificUserProject('parking', 'tests/regression/parking'),
  ],
});