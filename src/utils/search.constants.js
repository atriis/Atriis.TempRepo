/**
 * Search Default Constants
 *
 * This file defines default values used by search DSLs
 * across all products (Flights, Hotels, Cars, Rails).
 *
 * Why this exists:
 * - Avoids hardcoded numbers in test logic
 * - Keeps search behavior consistent
 * - Makes it easy to update defaults in one place
 *
 * IMPORTANT:
 * These values are NOT business rules.
 * They are test defaults chosen for stability.
 */

const SEARCH_DEFAULTS = {
  /**
   * Rail search defaults
   *
   * Used by Evolvi, Benerail and Amtrak searches.
   * Indices refer to the "nth available day" in the calendar.
   */
  RAIL: {
    DEPARTURE_INDEX: 9,  // Selects the 10th available date
    RETURN_INDEX: 12,    // Selects the 13th available date
  },

  /**
   * Benerail (EU Rail) search defaults — deliberately nearer than the shared RAIL defaults
   * above. Benerail inventory at the far-out RAIL dates was intermittently empty on the return
   * leg (AB#81914 fix-loop finding); Amtrak and Evolvi still use the shared RAIL defaults and
   * are unaffected by this override.
   */
  RAIL_BENERAIL: {
    DEPARTURE_INDEX: 4,  // Selects the 5th available date
    RETURN_INDEX: 6,     // Selects the 7th available date
  },

  /**
   * Flight search defaults
   *
   * Designed to avoid very near dates, which are often unavailable.
   */
  FLIGHT: {
    DEPARTURE_INDEX: 4,  // Selects the 5th available date
    RETURN_INDEX: 11,    // Selects the 12th available date
  },

  /**
   * Car rental defaults
   *
   * Pick-up and drop-off are based on available calendar days.
   */
  CAR: {
    PICKUP_INDEX: 0,     // First available date
    DROPOFF_INDEX: 5,    // Five days after pick-up
  },

  /**
   * Hotel booking defaults
   *
   * Uses number of nights instead of calendar indices.
   */
  HOTEL: {
    NIGHTS: 1,           // Default stay length
  },

  GROUND_TRANSPORT: {
    PICKUP_INDEX: 2,     // Selects the 3rd available date
  },
};

module.exports = {
  SEARCH_DEFAULTS,
};
