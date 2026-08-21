const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingSearchPage = require("@pages/UKParkingSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const logger = require("@utils/logger").child("UKParkingSearch-DSL");

/**
 * Airport names the parking search form uses, keyed by the IATA code the cart's flight quote card
 * renders. The two surfaces never agree on a format - the flight card shows "LGW", the parking
 * form is seeded with "Gatwick" - so a comparison between them needs this bridge.
 *
 * Deliberately limited to UK airports: UK Parking is a UK-only product, so a code outside this map
 * means either the trip does not depart from the UK or the map needs one more row - both worth an
 * explicit error rather than a silent mismatch.
 */
const UK_PARKING_AIRPORT_NAMES_BY_CODE = {
  LHR: 'Heathrow',
  LGW: 'Gatwick',
  STN: 'Stansted',
  LTN: 'Luton',
  LCY: 'London City',
  SEN: 'Southend',
  MAN: 'Manchester',
  BHX: 'Birmingham',
  EDI: 'Edinburgh',
  GLA: 'Glasgow',
  BRS: 'Bristol',
  NCL: 'Newcastle',
  LPL: 'Liverpool',
  EMA: 'East Midlands',
  LBA: 'Leeds Bradford',
  ABZ: 'Aberdeen',
  BFS: 'Belfast',
  CWL: 'Cardiff',
  SOU: 'Southampton',
  NWI: 'Norwich',
};

/**
 * Picks the nth available day for one date field and proves the field took it.
 *
 * Selecting a day is fire-and-forget, and the two parking dates are independent single-date
 * pickers sharing one screen: a click aimed at the field's own panel can land on a foreign or
 * still-closing one, which commits nothing. The flow then ran on to the Search click and failed
 * as "This field is required" three steps away from the cause. Confirming the field's value is
 * what makes the pick observable, and reopening the picker re-anchors the panel to the field
 * being set — which is exactly what a swallowed click got wrong — so one retry recovers it.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {Object} options
 * @param {string} options.label - Field name used in logs and the thrown error
 * @param {() => Promise<void>} options.openPicker - Opens this field's calendar
 * @param {() => Promise<string>} options.confirmFilled - Resolves with the committed value
 * @param {number} options.nthAvailable - Index of the day to pick within the open month
 * @param {number} [options.advanceMonths=0] - Months to advance before picking
 * @returns {Promise<string>} The committed value
 */
async function pickDateAndConfirm(
  page,
  { label, openPicker, confirmFilled, nthAvailable, advanceMonths = 0 },
) {
  const ukParkingSearchPage = getPageObject(page, UKParkingSearchPage);
  const searchPage = getPageObject(page, SearchPage);
  const attempts = 2;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    // A panel left open from the previous field steals the clicks meant for this one, and
    // selectDatesByNthAvailable picks from the first VISIBLE panel — so wait it out rather than
    // aiming into an ambiguous screen. A picker that refuses to close is left to the pick itself
    // to fail on, with the value check below naming it.
    await ukParkingSearchPage.waitForNoOpenDatePicker().catch(() => {});

    await openPicker();

    if (advanceMonths > 0) {
      await searchPage.clickCalendarNextArrow(advanceMonths);
    }

    await selectDatesByNthAvailable(page, {
      startIndex: nthAvailable,
      endIndex: null, // Both parking dates are single-date pickers
    });

    try {
      return await confirmFilled();
    } catch (error) {
      lastError = error;
      logger.warn(`The ${label} date did not take the pick — retrying once`, {
        label,
        attempt,
        attempts,
      });
    }
  }

  throw new Error(
    `[UKParkingSearch] The ${label} date stayed empty after ${attempts} attempts to pick day ` +
    `index ${nthAvailable}: the day cell was clicked but the field never committed a value, so ` +
    `the calendar the clicks reached did not belong to it. Original: ${lastError.message}`
  );
}

/**
 * UKParkingSearch DSL
 *
 * Provides business-level methods for searching UK airport parking.
 * All business logic for the UK Parking search flow should be placed here.
 */
const UKParkingSearch = {
  /**
   * Performs a complete UK parking search.
   *
   * Steps:
   * 1. Navigates to the parking tab
   * 2. Fills in the airport
   * 3. Selects parking start date
   * 4. Selects return date
   * 5. Ensures both required times hold a value
   * 6. Executes the search and confirms it was accepted
   *
   * @param {Object} page - Playwright page instance
   * @param {string} airport - UK Airport name or code (e.g., "Heathrow", "LHR")
   * @param {number} parkingFromIndex - Index of parking start date in calendar (>= 0)
   * @param {number} returnIndex - Index of return date in calendar (>= 0)
   * @returns {Promise<{searched: boolean, airport: string, parkingFromDate: string, returnDate: string}>}
   * @throws {Error} If airport is empty or indices are negative
   */
  async searchUKParking(
    page,
    airport = "LHR",
    parkingFromIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
  ) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!airport || typeof airport !== 'string') {
      throw new Error('airport must be a non-empty string');
    }
    
    if (parkingFromIndex < 0) {
      throw new Error(`parkingFromIndex must be >= 0, got ${parkingFromIndex}`);
    }
    
    if (returnIndex < 0) {
      throw new Error(`returnIndex must be >= 0, got ${returnIndex}`);
    }
    
    // Start of the search flow

    const ukParkingSearchPage = getPageObject(page, UKParkingSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    // 1. Navigate to parking tab
    await ukParkingSearchPage.clickParkingTab();

    // 2. Fill in airport, once the form has finished rendering/animating in
    await ukParkingSearchPage.waitForSearchFormReady();
    await ukParkingSearchPage.typeUKAirport(airport);

    // 3. Select parking start date
    const parkingFromDate = await pickDateAndConfirm(page, {
      label: 'parking-from',
      openPicker: () => ukParkingSearchPage.clickParkingFromDateField(),
      confirmFilled: () => ukParkingSearchPage.waitForParkingFromDateFilled(),
      nthAvailable: parkingFromIndex,
      advanceMonths: 3,
    });

    // 4. Select return date. Arrival and return are two independent single-date pickers, so the
    // arrival popper must be fully gone before the return one opens — selectDatesByNthAvailable
    // picks from the first VISIBLE panel, and a still-closing arrival panel would swallow the
    // clicks, leaving the return date at its prefilled value (which the app then rejects as an
    // "Invalid date" because it precedes the newly chosen arrival).
    const returnDate = await pickDateAndConfirm(page, {
      label: 'return',
      openPicker: () => ukParkingSearchPage.clickReturnDateField(),
      confirmFilled: () => ukParkingSearchPage.waitForReturnDateFilled(),
      nthAvailable: returnIndex,
    });

    // The other half of that same swallowed-click failure: clicks meant for the return panel that
    // land on the arrival one silently REWRITE the arrival date instead of leaving it empty, which
    // the app reports as a bare "Invalid date" on a field this flow already filled correctly. The
    // arrival value is re-read rather than trusted, so the mix-up is named where it happens.
    const parkingFromDateAfterReturn = await ukParkingSearchPage.getParkingFromDateValue();
    if (parkingFromDateAfterReturn !== parkingFromDate) {
      throw new Error(
        `[UKParkingSearch.searchUKParking] Picking the return date moved the parking-from date ` +
        `from "${parkingFromDate}" to "${parkingFromDateAfterReturn}": the return clicks landed ` +
        `on the parking-from calendar, so neither date can be trusted.`
      );
    }

    logger.info('Parking dates selected', { parkingFromDate, returnDate });

    // 5. Both times are required. From the cart they arrive prefilled from the trip's search
    // suggestion; on a new trip they start empty and must be primed. Priming only when empty
    // keeps the timepicker popper closed in the prefilled case, where an open popper would cover
    // the Search button and swallow the submit click.
    await ukParkingSearchPage.ensureDropOffTimeIsSet();
    await ukParkingSearchPage.ensureReturnTimeIsSet();

    // 6. Execute search
    // The primary-class-specific button avoids a strict-mode violation: when this search
    // runs from the cart's "add parking" drawer, the trip overview behind it renders its
    // own unrelated ".search-btn" alongside the drawer's — the "btn--primary" class is the
    // one distinguishing selector present in both this and the general search-page context.
    await searchPage.waitAndClickPrimarySearchButtonFromCart();

    // The click is forced (see waitAndClickPrimarySearchButtonFromCart), so a rejected submit
    // looks identical to a successful one from here. The form validates on submit and renders the
    // reason in place instead of navigating, so surface that text rather than letting it become an
    // opaque 120s "waiting for Add to trip" timeout on a results page that was never requested.
    const outcome = await ukParkingSearchPage.waitForSearchOutcome();
    if (outcome === 'rejected') {
      const messages = await ukParkingSearchPage.getValidationMessages();
      throw new Error(
        `[UKParkingSearch.searchUKParking] The parking search form rejected the Search click and ` +
        `stayed open: ${messages.join('; ')}. Submitted ${airport} for ${parkingFromDate} → ` +
        `${returnDate}. No results page was requested.`
      );
    }

    return { searched: true, airport, parkingFromDate, returnDate };
  },

  /**
   * Checks the pre-populated parking location against the departure airport of the trip's flight.
   *
   * The two sides speak different languages: the cart's flight quote card renders an IATA code
   * ("LGW") while the parking form is seeded with an airport name ("Gatwick"), so the code is
   * translated through UK_PARKING_AIRPORT_NAMES_BY_CODE rather than compared raw. An unmapped code
   * throws naming itself, because a silent non-match would read as an app defect rather than as
   * missing test data.
   *
   * Returns rather than asserts: the caller reports the mismatch, so both sides of it (what the
   * flight departs from, what the form was seeded with) appear in the failure.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} departureAirportCode - IATA code of the flight's departure airport
   * @returns {Promise<{matches: boolean, prePopulatedLocation: string, departureAirportCode: string, expectedAirportName: string}>}
   * @throws {Error} If the code is missing or not a UK airport this map knows
   */
  async verifyLocationMatchesFlightOrigin(page, departureAirportCode) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!departureAirportCode || typeof departureAirportCode !== 'string') {
      throw new Error(
        `departureAirportCode must be a non-empty string, got: ${typeof departureAirportCode}`
      );
    }

    const code = departureAirportCode.trim().toUpperCase();
    const expectedAirportName = UK_PARKING_AIRPORT_NAMES_BY_CODE[code];

    if (!expectedAirportName) {
      throw new Error(
        `[UKParkingSearch.verifyLocationMatchesFlightOrigin] No UK airport name is mapped for the ` +
        `flight's departure code "${code}", so the pre-populated parking location cannot be ` +
        `checked against it. Add it to UK_PARKING_AIRPORT_NAMES_BY_CODE if UK Parking serves it.`
      );
    }

    const prePopulatedLocation = await UKParkingSearch.getPrePopulatedAirport(page);
    const matches = prePopulatedLocation.toLowerCase().includes(expectedAirportName.toLowerCase());

    logger.info('Compared the pre-populated parking location with the flight origin', {
      departureAirportCode: code,
      expectedAirportName,
      prePopulatedLocation,
      matches,
    });

    return { matches, prePopulatedLocation, departureAirportCode: code, expectedAirportName };
  },

  /**
   * Reads the location the parking search form arrived pre-populated with.
   *
   * Opened from the cart, parking-search-inputs.vue seeds its origin from the trip's existing
   * search suggestion, so the value is the app's own carry-over of the flight's departure
   * airport - not something this flow typed. The field is therefore read, never filled.
   *
   * An empty field is returned as an empty string rather than thrown on: "pre-populated with the
   * wrong airport" and "not pre-populated at all" are both failures of the same caller assertion,
   * and reporting them there names the expected airport alongside what was actually carried over.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {object} [options]
   * @param {number} [options.timeout=10000] - How long to wait for the value to land
   * @returns {Promise<string>} The pre-populated location, empty string when none arrived
   */
  async getPrePopulatedAirport(page, { timeout = 10000 } = {}) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a number >= 0, got: ${timeout}`);
    }

    const ukParkingSearchPage = getPageObject(page, UKParkingSearchPage);

    // The form is inside the cart's edit-search drawer, which slides in around lazily loaded
    // inputs - reading before it settles would report an airport field that is not on screen yet.
    await ukParkingSearchPage.waitForSearchFormReady();

    try {
      return await ukParkingSearchPage.waitForUKAirportFilled(timeout);
    } catch (error) {
      logger.warn('The parking location field never received a pre-populated value', {
        timeout,
        reason: error.message,
      });
      return ukParkingSearchPage.getUKAirportValue();
    }
  },
};

module.exports = UKParkingSearch;
