/**
 * Route & Location Resolution Helpers
 *
 * These helpers normalize input so DSLs can accept
 * flexible formats without duplicating validation logic.
 *
 * Why this exists:
 * - Tests may use predefined routes from JSON files
 * - Tests may also define routes inline for flexibility
 * - DSLs should not care where the data comes from
 */

/**
 * Resolves a route used in search operations.
 *
 * Supported inputs:
 * 1) String key → resolved from a routes configuration file
 *    Example: "LIS_NYC"
 *
 * 2) Inline object → used directly
 *    Example: { from: "LIS", to: "NYC" }
 *
 * @param {string|Object} routeInput - route key OR { from, to }
 * @param {Object} routesConfig - routes loaded from JSON
 * @param {string} routeType - label used in error messages
 * @returns {{ from: string, to: string }}
 */
function resolveRoute(routeInput, routesConfig, routeType = "route") {

  // Route defined by key (preferred for reuse and consistency)
  if (typeof routeInput === "string") {
    // Try direct lookup (flat structure or full path)
    if (routesConfig[routeInput]) {
      return routesConfig[routeInput];
    }

    // Search nested groups (us, europe, intercontinental, etc)
    for (const groupKey of Object.keys(routesConfig)) {
      const group = routesConfig[groupKey];
      if (group && typeof group === "object" && group[routeInput]) {
        return group[routeInput];
      }
    }

    throw new Error(
      `Route "${routeInput}" was not found in any group in ${routeType}.json. ` +
      "Check that the key exists and is spelled correctly.",
    );
  }

  // Route defined inline (useful for one-off scenarios)
  if (
    typeof routeInput === "object" &&
    routeInput !== null &&
    routeInput.from &&
    routeInput.to
  ) {
    return routeInput;
  }

  throw new Error(
    "Invalid route input. Provide either a route key (string) " +
    "or an object with { from, to }.",
  );
}

/**
 * Resolves a single location value from flexible input.
 *
 * Supported inputs:
 * 1) String → used directly
 * 2) Object → extracts the first matching property
 *
 * This is useful when different DSLs use slightly different naming.
 *
 * @param {string|Object} locationInput
 * @param {string[]} [propertyKeys=['where','place','location','destination']]
 * @returns {string}
 */
function resolveLocation(
  locationInput,
  propertyKeys = ["where", "place", "location", "destination"],
) {
  // Direct string input (most common case)
  if (typeof locationInput === "string") {
    return locationInput;
  }

  // Object input with one of the supported properties
  if (typeof locationInput === "object" && locationInput !== null) {
    for (const key of propertyKeys) {
      if (locationInput[key]) {
        return locationInput[key];
      }
    }
  }

  const expectedKeys = propertyKeys.map(k => `{ ${k} }`).join(" or ");
  throw new Error(
    `Invalid location input. Provide a string or an object containing ${expectedKeys}.`,
  );
}

module.exports = {
  resolveRoute,
  resolveLocation,
};
