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
 * - generateRandomSupplierFlightRoutes does the same over flightSupplierRoutes.json, where each
 *   supplier carries its own region-grouped routes (suppliers.<name>.routes.<region>.<key>)
 */
const flights = require("../../data/flights.json");
const flightSupplierRoutes = require("../../data/flightSupplierRoutes.json");

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

/**
 * Returns up to `count` distinct routes for one supplier from flightSupplierRoutes.json, in random
 * order - the first is the route to search, the rest are fallbacks for when it returns no results.
 * The supplier name is matched ignoring case, so "Lufthansa NDC" and "lufthansa ndc" are the same.
 *
 * @param {string} supplier - supplier name as keyed in flightSupplierRoutes.json, e.g. "Lufthansa NDC"
 * @param {string} [region] - e.g. "europe" or "intercontinental"; all regions when omitted, throws when unknown
 * @param {number} [count=1]
 * @returns {Array<{ from: string, to: string, key: string, region: string }>}
 */
function generateRandomSupplierFlightRoutes(supplier, region, count = 1) {
  const suppliers = flightSupplierRoutes.suppliers || {};
  const supplierKey = Object.keys(suppliers).find(
    (name) => name.toLowerCase() === String(supplier || "").trim().toLowerCase(),
  );

  if (!supplierKey) {
    throw new Error(
      `Supplier "${supplier}" has no routes in flightSupplierRoutes.json. ` +
      `Available suppliers: ${Object.keys(suppliers).join(", ")}`,
    );
  }

  const routesByRegion = suppliers[supplierKey].routes || {};
  // A region the test names explicitly must exist - silently falling back to every region
  // would run a europe test on an intercontinental route after a typo.
  if (region && !routesByRegion[region]) {
    throw new Error(
      `Supplier "${supplierKey}" has no "${region}" routes in flightSupplierRoutes.json. ` +
      `Available regions: ${Object.keys(routesByRegion).join(", ")}`,
    );
  }

  const regions = region ? [region] : Object.keys(routesByRegion);
  const routes = regions.flatMap((regionKey) =>
    Object.entries(routesByRegion[regionKey]).map(([key, { from, to }]) => ({ from, to, key, region: regionKey })),
  );

  if (routes.length === 0) {
    throw new Error(`Supplier "${supplierKey}" has no routes in flightSupplierRoutes.json.`);
  }

  // Fisher-Yates shuffle, so every route is equally likely to be tried first
  for (let i = routes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [routes[i], routes[j]] = [routes[j], routes[i]];
  }

  return routes.slice(0, count);
}

module.exports = {
  generateRandomFlightRoute,
  generateRandomSupplierFlightRoutes,
};
