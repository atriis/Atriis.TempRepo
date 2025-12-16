/**
 * Search Default Constants
 *
 * Centralized constants for search functionality across all DSL modules.
 * Provides consistent default values for date indices and search parameters.
 */

const SEARCH_DEFAULTS = {
  // Rail search defaults (Evolvi, Benerail, Amtrak)
  RAIL: {
    DEPARTURE_INDEX: 9,  // 10th available date
    RETURN_INDEX: 12,    // 13th available date
  },

  // Flight search defaults
  FLIGHT: {
    DEPARTURE_INDEX: 4,  // 5th available date
    RETURN_INDEX: 11,    // 12th available date
  },

  // Car search defaults
  CAR: {
    PICKUP_INDEX: 0,     // 1st available date
    DROPOFF_INDEX: 5,    // 6th available date (pickup + 5 days)
  },

  // Hotel search defaults
  HOTEL: {
    NIGHTS: 1,           // Default stay: 1 night
  },
};

module.exports = {
  SEARCH_DEFAULTS,
};