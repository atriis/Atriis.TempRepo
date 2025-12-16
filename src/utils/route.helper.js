/**
 * Input Resolution Utility
 *
 * Provides shared functions for resolving various types of input across different search DSLs.
 * Supports both configuration keys from JSON files and inline objects.
 */

/**
 * Resolves route input for search operations.
 * Accepts either:
 * - route key (string) → resolved from provided routes object
 * - inline route object → { from, to }
 *
 * @param {string|Object} routeInput - route key OR { from, to } object
 * @param {Object} routesConfig - routes configuration object (e.g., flightRoutes.routes)
 * @param {string} routeType - type of route for error messages (e.g., "flight", "evolvi", "amtrak")
 * @returns {Object} - resolved route object with { from, to } properties
 * @throws {Error} - When route key is not found or input format is invalid
 */
function resolveRoute(routeInput, routesConfig, routeType = "route") {
  // Route key from JSON
  if (typeof routeInput === "string") {
    const route = routesConfig[routeInput];
    if (!route) {
      throw new Error(`Route "${routeInput}" not found in ${routeType}.json`);
    }
    return route;
  }

  // Inline route object
  if (
    typeof routeInput === "object" &&
    routeInput !== null &&
    routeInput.from &&
    routeInput.to
  ) {
    return routeInput;
  }

  throw new Error(
    'Invalid route input. Expected route key (string) or { from, to } object.'
  );
}

/**
 * Resolves location/place input for search operations.
 * Accepts either:
 * - location string → used directly
 * - location object → extracts from specified property keys
 *
 * @param {string|Object} locationInput - location string OR object with location property
 * @param {string[]} [propertyKeys=['where', 'place', 'location', 'destination']] - property keys to check in object
 * @returns {string} - resolved location string
 * @throws {Error} - When input format is invalid or no valid property found
 */
function resolveLocation(locationInput, propertyKeys = ['where', 'place', 'location', 'destination']) {
  // Direct string location
  if (typeof locationInput === "string") {
    return locationInput;
  }

  // Location object with specified properties
  if (typeof locationInput === "object" && locationInput !== null) {
    for (const key of propertyKeys) {
      if (locationInput[key]) {
        return locationInput[key];
      }
    }
  }

  const keyList = propertyKeys.map(k => `{ ${k} }`).join(' or ');
  throw new Error(
    `Invalid location input. Expected location string or ${keyList} object.`
  );
}

module.exports = {
  resolveRoute,
  resolveLocation,
};