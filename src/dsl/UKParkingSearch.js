const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingSearchPage = require("@pages/UKParkingSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const logger = require("@utils/logger").child("UKParkingSearch-DSL");

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
};

module.exports = UKParkingSearch;
