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
    // Pick-up time used whenever a test has to CHANGE the time rather than accept the form's
    // default. ground-transport.store.ts seeds pickupTime as "10:00", so a value that differs from
    // it is what proves the chosen time was carried through; the minute is a multiple of 15
    // because app-timepicker is mounted with steps="00:15".
    PICKUP_TIME: "14:30",
  },

  /**
   * UK Parking defaults
   *
   * Same indices the flight search uses — parking inventory is reliable at those dates. The EDIT_*
   * pair is for re-running an existing search from the results page: one day past the original
   * pick, which is the smallest change that provably moved the date (the edit drawer opens
   * pre-filled, so an unchanged value cannot be told apart from a swallowed click).
   */
  PARKING: {
    PARKING_FROM_INDEX: 4,       // Selects the 5th available date
    RETURN_INDEX: 11,            // Selects the 12th available date
    EDIT_PARKING_FROM_INDEX: 5,  // One day past PARKING_FROM_INDEX
    EDIT_RETURN_INDEX: 12,       // One day past RETURN_INDEX
  },
};

module.exports = {
  SEARCH_DEFAULTS,
};
