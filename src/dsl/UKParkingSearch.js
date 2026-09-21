const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingSearchPage = require("@pages/UKParkingSearchPage");
const UKParkingResultsPage = require("@pages/UKParkingResultsPage");
const { SearchPage } = require("@pages/SearchPage");
const { ResultsPage } = require("@pages/ResultsPage");
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
    parkingFromIndex = SEARCH_DEFAULTS.PARKING.PARKING_FROM_INDEX,
    returnIndex = SEARCH_DEFAULTS.PARKING.RETURN_INDEX,
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
   * Re-runs the trip's parking search with different dates, without leaving the results page.
   *
   * The "Edit" control belongs to the trip bar (trip-bar.vue `.edit-search-btn`), not to
   * parking-results.vue, and it opens the shared edit-search drawer (trip-edit-search.vue) with
   * the parking form pre-filled from the search that produced the results behind it — so only the
   * dates are touched here, and the location is deliberately left alone.
   *
   * Every date is required to CHANGE rather than merely to hold a value, which is the difference
   * that matters in this context: the fields open pre-filled, so a day-cell click that missed its
   * panel leaves a perfectly valid form that silently re-submits the ORIGINAL search. A
   * de-duplication check downstream ("one parking quote in the cart after adding a result again")
   * would then pass without an edit ever having happened.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {Object} [options]
   * @param {number} [options.parkingFromIndex] - Day index for the new parking start date, within
   *   the month the picker opens on. Defaults to SEARCH_DEFAULTS.PARKING.EDIT_PARKING_FROM_INDEX —
   *   one day past the initial search's pick, so the edit lands on a different, equally valid date.
   * @param {number} [options.returnIndex] - Day index for the new return date, same convention.
   * @returns {Promise<{edited: boolean, parkingFromDate: string, returnDate: string, previousParkingFromDate: string, previousReturnDate: string, loaderSeen: boolean}>}
   * @throws {Error} If page is missing, an index is negative, or a date never changed
   */
  async editSearchDatesFromResultsPage(
    page,
    {
      parkingFromIndex = SEARCH_DEFAULTS.PARKING.EDIT_PARKING_FROM_INDEX,
      returnIndex = SEARCH_DEFAULTS.PARKING.EDIT_RETURN_INDEX,
    } = {},
  ) {
    if (!page) {
      throw new Error('[UKParkingSearch.editSearchDatesFromResultsPage] "page" is required.');
    }
    if (parkingFromIndex < 0) {
      throw new Error(`[UKParkingSearch.editSearchDatesFromResultsPage] "parkingFromIndex" must be >= 0, got ${parkingFromIndex}`);
    }
    if (returnIndex < 0) {
      throw new Error(`[UKParkingSearch.editSearchDatesFromResultsPage] "returnIndex" must be >= 0, got ${returnIndex}`);
    }

    const ukParkingSearchPage = getPageObject(page, UKParkingSearchPage);
    const ukParkingResultsPage = getPageObject(page, UKParkingResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);
    const searchPage = getPageObject(page, SearchPage);

    // 1. Open the edit-search drawer from the trip bar.
    await resultsPage.clickEditButton();

    // 2. The drawer slides in around a lazily loaded parking form — act only once it has settled,
    //    or the date poppers open against a form that is still moving.
    await ukParkingSearchPage.waitForSearchFormReady();

    // 3. Capture what the form arrived with, so each new pick can be required to differ from it.
    const previousParkingFromDate = await ukParkingSearchPage.waitForParkingFromDateFilled(10000);
    const previousReturnDate = await ukParkingSearchPage.waitForReturnDateFilled(10000);

    // 4. New parking-from date. No month advance here (unlike the initial search): the picker opens
    //    on the month the existing value sits in — already three months out — so the next index
    //    within that same month is a different day of an equally valid month.
    const parkingFromDate = await pickDateAndConfirm(page, {
      label: 'parking-from (edit)',
      openPicker: () => ukParkingSearchPage.clickParkingFromDateField(),
      confirmFilled: () => ukParkingSearchPage.waitForParkingFromDateChanged(previousParkingFromDate),
      nthAvailable: parkingFromIndex,
    });

    // 5. New return date, kept later than the new arrival by the same index gap the initial search
    //    used.
    const returnDate = await pickDateAndConfirm(page, {
      label: 'return (edit)',
      openPicker: () => ukParkingSearchPage.clickReturnDateField(),
      confirmFilled: () => ukParkingSearchPage.waitForReturnDateChanged(previousReturnDate),
      nthAvailable: returnIndex,
    });

    // Same swallowed-click guard the initial search carries: return clicks that land on the
    // parking-from calendar REWRITE the arrival date rather than leaving it untouched, which the
    // app then reports as a bare "Invalid date" on a field this flow set correctly.
    const parkingFromDateAfterReturn = await ukParkingSearchPage.getParkingFromDateValue();
    if (parkingFromDateAfterReturn !== parkingFromDate) {
      throw new Error(
        `[UKParkingSearch.editSearchDatesFromResultsPage] Picking the new return date moved the ` +
        `parking-from date from "${parkingFromDate}" to "${parkingFromDateAfterReturn}": the return ` +
        `clicks landed on the parking-from calendar, so neither edited date can be trusted.`
      );
    }

    logger.info('Parking search dates edited from the results page', {
      previousParkingFromDate,
      parkingFromDate,
      previousReturnDate,
      returnDate,
    });

    // 6. Re-submit through the drawer's own Search button, then wait for the results behind it to
    //    be REPLACED rather than merely present — the previous set stays on screen until the new
    //    one arrives.
    await searchPage.waitAndClickEditSearchButton();
    const { loaderSeen } = await ukParkingResultsPage.waitForResultsReloaded();
    await resultsPage.waitForAddToTripText();

    return {
      edited: true,
      parkingFromDate,
      returnDate,
      previousParkingFromDate,
      previousReturnDate,
      // false means the re-search came back before the loader painted, so these results were
      // never observed to be re-fetched — worth having in the step log when a stale-results
      // failure is being diagnosed downstream.
      loaderSeen,
    };
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
   * Types text into the UK parking location field and leaves it uncommitted, so the autocomplete
   * popper it triggers can be inspected.
   *
   * Nothing is selected and the field is never blurred — committing a value is what the real
   * search flow (searchUKParking) does, and it would close the popper this exists to expose.
   *
   * The typing itself is the generic SearchPage helper, not a parking one: clearing, typing and
   * waiting out the autocomplete debounce is identical for every location field in the app, and
   * the same helper has to be able to retype into this field for the assertion's positive control.
   * The only parking-specific part left here is aiming at the right field.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} text - Location text to type
   * @returns {Promise<{typed: true, text: string}>}
   * @throws {Error} If page is missing or text is not a non-empty string
   */
  async typeInUKParkingLocationField(page, text) {
    if (!page) {
      throw new Error('[UKParkingSearch.typeInUKParkingLocationField] "page" is required.');
    }
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error(
        `[UKParkingSearch.typeInUKParkingLocationField] "text" must be a non-empty string, got: ${typeof text}`
      );
    }

    logger.debug('Typing an uncommitted query into the UK parking location field', { text });

    const ukParkingSearchPage = getPageObject(page, UKParkingSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    try {
      // clickParkingTab no-ops when the parking form is already the one on screen, so this covers
      // both the standalone search page and the cart's parking drawer; waitForSearchFormReady
      // then waits out the drawer slide-in before anything touches a field.
      await ukParkingSearchPage.clickParkingTab();
      await ukParkingSearchPage.waitForSearchFormReady();
      await ukParkingSearchPage.focusLocationField();
      await searchPage.typeIntoFocusedAutocomplete(text);
    } catch (error) {
      throw new Error(
        `[UKParkingSearch.typeInUKParkingLocationField] Could not put "${text}" into the UK ` +
        `parking location field — the parking form never became usable. Original: ${error.message}`
      );
    }

    // The caret is deliberately left in the field: the assertion that follows identifies the
    // autocomplete under test by focus alone.
    return { typed: true, text };
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
