/**
 * generateRandomFlightRoute
 *
 * Returns a random flight route key from flights.json, grouped by region.
 *
 * Why this exists:
 * - Allows tests to select random valid routes for coverage
 * - Prevents hardcoding and keeps tests maintainable
 * - Ensures only supported routes are used
 *
 * IMPORTANT:
 * - Only for test automation, not production
 * - Relies on the structure of flights.json (routes.us, routes.europe, routes.intercontinental)
 */
const flights = require("../../data/flights.json");

function getAllRouteKeys() {
  const regions = flights.routes;
  if (!regions || typeof regions !== 'object') {
    throw new Error('flights.routes is missing or invalid in flights.json');
  }
  return Object.values(regions).flatMap(region => Object.keys(region));
}

function getAllRouteKeysByRegion() {
  const regions = flights.routes;
  if (!regions || typeof regions !== 'object') {
    throw new Error('flights.routes is missing or invalid in flights.json');
  }
  return Object.fromEntries(
    Object.entries(regions).map(([region, routes]) => [region, Object.keys(routes)]),
  );
}

function generateRandomFlightRoute(region) {
  const routeKeysByRegion = getAllRouteKeysByRegion();
  let regionKeys = Object.keys(routeKeysByRegion);
  
  if (regionKeys.length === 0) {
    throw new Error(
      'No regions available in flights.json. ' +
      'Check that flights.routes contains us, europe, or intercontinental.'
    );
  }

  let selectedRegion = region;
  if (!selectedRegion || !regionKeys.includes(selectedRegion)) {
    // Pick a random region if not specified or invalid
    selectedRegion = regionKeys[Math.floor(Math.random() * regionKeys.length)];
  }
  
  const keys = routeKeysByRegion[selectedRegion];
  if (!keys || keys.length === 0) {
    throw new Error(
      `No routes found for region: "${selectedRegion}". ` +
      `Available regions: ${regionKeys.join(', ')}`
    );
  }
  
  return keys[Math.floor(Math.random() * keys.length)];
}

module.exports = {
  generateRandomFlightRoute,
  getAllRouteKeys,
  getAllRouteKeysByRegion,
};
