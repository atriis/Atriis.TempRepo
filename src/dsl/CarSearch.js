const { expect } = require("@playwright/test");
const CarSearchPage = require("@pages/CarSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { CartPage } = require("@pages/CartPage");
const {
  selectDatesByNthAvailable,
  advanceSinglePickerCalendarUntilMonthVisible,
  clickDayInVisibleMonth,
  dayAndMonthMatch,
} = require("@utils/calendar.helper");
const { resolveLocation } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { getPageObject } = require("@utils/pageObjectCache");
const { normalizeText } = require("@utils/text");
const logger = require("@utils/logger").child("CarSearch");
const carLocations = require("@data/cars.json");

// 2 same-month day-shift attempts, then 1 final month-advance attempt as a last resort.
const MAX_NO_RESULTS_RETRIES = 3;
// How far to shift the pickup/drop-off day index on each non-final no-results retry attempt.
// Shifting within the same visible month keeps the retry search close to the original dates.
const NO_RESULTS_RETRY_DAY_STEP = 3;
// Delivery & Collection place search (car-dc-autocomplete): runs from 3 typed characters, and
// Hertz (ZE) is excluded from it in this phase (ADO 84137).
const DC_MIN_CHARS_FOR_SEARCH = 3;
const HERTZ_PROVIDER_CODE = 'ZE';
const DC_NO_SUGGESTIONS_SETTLE_MS = 2000;

/**
 * How car-dc-autocomplete renders a place (Atriis.App car-dc-autocomplete-rows.ts
 * toDcPlaceDisplayName): address line 1, line 2 and city in title case, then the country code.
 * @param {object} place
 * @returns {string}
 */
function toDcPlaceDisplayName(place) {
  const titleCase = (value) => (value || '').trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  return [place.addressLine1, place.addressLine2, place.city].map(titleCase)
    .concat((place.countryCode || '').trim())
    .filter(Boolean)
    .join(', ');
}

// Case- and whitespace-insensitive, so a title-casing nuance cannot fail an otherwise exact row.
const normalizeTextLoose = (value) => normalizeText(value || '').toLowerCase();

/**
 * Parses a "HH:mm" time string into zero-padded [hour, minute] strings matching the
 * app-timepicker's el-select option labels.
 * @param {string} timeString - e.g. "15:00"
 * @param {string} paramName - for error messages
 * @returns {[string, string]}
 * @throws {Error} If timeString is not "HH:mm"
 */
function parseHourMinute(timeString, paramName) {
  const match = /^([0-9]{1,2}):([0-9]{1,2})$/.exec(String(timeString).trim());
  if (!match) {
    throw new Error(`${paramName} must be a "HH:mm" time string, got: ${timeString}`);
  }
  return [match[1].padStart(2, '0'), match[2].padStart(2, '0')];
}

async function selectDropoffDateWithFallback(page, carSearchPage, dropoffIndex) {
  try {
    await selectDatesByNthAvailable(page, {
      startIndex: dropoffIndex,
      endIndex: null,
      pickerPosition: "last",
    });
  } catch (error) {
    const shouldTryNextMonth =
      typeof error?.message === "string" &&
      error.message.includes("Not enough available dates in the calendar");

    if (!shouldTryNextMonth) {
      throw error;
    }

    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: dropoffIndex,
      endIndex: null,
      pickerPosition: "last",
    });
  }
}

async function ensureDropoffAfterPickup(page, carSearchPage, dropoffIndex) {
  const pickupDateValue = await carSearchPage.getPickupDateFieldValue();
  const dropoffDateValue = await carSearchPage.getDropoffDateFieldValue();

  if (pickupDateValue === dropoffDateValue) {
    await carSearchPage.clickDropoffDateField();
    await selectDropoffDateWithFallback(page, carSearchPage, dropoffIndex + 1);
  }
}

async function retryCarSearchByChangingDatesOnNoResults(
  page,
  {
    pickupIndex,
    dropoffIndex,
    maxRetries = MAX_NO_RESULTS_RETRIES,
  } = {},
) {
  const resultsPage = getPageObject(page, ResultsPage);
  const searchPage = getPageObject(page, SearchPage);
  const carSearchPage = getPageObject(page, CarSearchPage);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const status = await resultsPage.waitForCarResultsOrNoResults(60000);
    if (status === "results") {
      return { retriesUsed: attempt - 1, resolved: true };
    }

    const isLastAttempt = attempt === maxRetries;
    const retryPickupIndex = isLastAttempt ? pickupIndex : pickupIndex + attempt * NO_RESULTS_RETRY_DAY_STEP;
    const retryDropoffIndex = isLastAttempt ? dropoffIndex : dropoffIndex + attempt * NO_RESULTS_RETRY_DAY_STEP;

    logger.info(
      isLastAttempt
        ? "No car results found. Retrying by advancing to next month (final attempt)"
        : "No car results found. Retrying by shifting pickup/drop-off dates within the same month",
      {
        attempt,
        maxRetries,
        pickupIndex: retryPickupIndex,
        dropoffIndex: retryDropoffIndex,
      },
    );

    const noResultsEditButton = resultsPage.getNoResultsEditSearchButton();
    if (await noResultsEditButton.isVisible().catch(() => false)) {
      await noResultsEditButton.click();
    } else {
      await resultsPage.clickEditButton();
    }

    await searchPage.clickPickupDateField();
    if (isLastAttempt) {
      await searchPage.clickCalendarNextArrow(1);
    }
    await selectDatesByNthAvailable(page, {
      startIndex: retryPickupIndex,
      endIndex: null,
    });

    await carSearchPage.clickDropoffDateField();
    await selectDropoffDateWithFallback(page, carSearchPage, retryDropoffIndex);
    await ensureDropoffAfterPickup(page, carSearchPage, retryDropoffIndex);

    await searchPage.waitAndClickSearchButton();
  }

  const finalStatus = await resultsPage.waitForCarResultsOrNoResults(60000);
  return { retriesUsed: maxRetries, resolved: finalStatus === "results" };
}

/**
 * CarSearch DSL
 *
 * Describes how users search for rental cars.
 */
const CarSearch = {
  /**
   * Selects a rental agency by name.
   * @param {Object} page - Playwright page instance
   * @param {string} agencyName - Name of the rental agency (required)
   * @throws {Error} If agencyName is not provided
   */
  async selectRentalAgencyByName(page, agencyName) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!agencyName || typeof agencyName !== 'string') {
      throw new Error('agencyName must be a non-empty string');
    }
    const carSearchPage = getPageObject(page, CarSearchPage);

    await carSearchPage.typeRentalAgencyName(agencyName);
    await carSearchPage.clickRentalAgencyDropdownOption(agencyName);
  },

  /**
   * Searches for a car by place (airport or city).
   * @param {Object} page - Playwright page instance
   * @param {string|Object} placeInput - Location or location object
   * @param {number} monthsAhead - Number of months ahead to search
   * @param {Object} options - Search configuration
   * @param {number} options.pickupIndex - Pickup date index (>= 0)
   * @param {number} options.dropoffIndex - Drop-off date index (>= 0)
   * @param {string} [options.pickupTime] - Explicit pick-up time "HH:mm" (24h, zero-padded).
   *   Defaults to the form's own pre-filled "10:00" when omitted.
   * @param {string} [options.dropoffTime] - Explicit drop-off time "HH:mm" (24h, zero-padded).
   *   Defaults to the form's own pre-filled "10:00" when omitted.
   * @returns {Promise<{searched: boolean, place: string, monthsAhead: number, pickupIndex: number, dropoffIndex: number, pickupDate: string, dropoffDate: string, noResultsRetry: Object}>} Search result including the selected pickup/drop-off date field values
   * @throws {Error} If pickupIndex or dropoffIndex are negative
   */
  async searchCarByPlace(
    page,
    placeInput = carLocations.defaultLocation,
    monthsAhead = 1,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
      maxRetries = MAX_NO_RESULTS_RETRIES,
      pickupTime,
      dropoffTime,
    } = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }

    if (pickupIndex < 0) {
      throw new Error(`pickupIndex must be >= 0, got ${pickupIndex}`);
    }

    if (dropoffIndex < 0) {
      throw new Error(`dropoffIndex must be >= 0, got ${dropoffIndex}`);
    }
    const place = resolveLocation(
      placeInput,
      ["place", "location"],
      carLocations,
    );

    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await carSearchPage.clickCarTab();
    await searchPage.fillInOrField(place, 1);

    // Pickup date
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow(monthsAhead);

    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    // Drop-off date
    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: dropoffIndex,
      endIndex: null,
    });

    if (pickupTime) {
      const [hour, minute] = parseHourMinute(pickupTime, 'pickupTime');
      await carSearchPage.setTimeFieldTo('pickup', hour, minute);
    }

    if (dropoffTime) {
      const [hour, minute] = parseHourMinute(dropoffTime, 'dropoffTime');
      await carSearchPage.setTimeFieldTo('dropoff', hour, minute);
    }

    // Capture the selected pickup/drop-off dates while the search form is still open and
    // the inputs are visible/populated. Exposed on the return so callers (e.g. a follow-on
    // flight search in a single-PNR trip) can align the flight dates to the car rental.
    const pickupDate = await carSearchPage.getPickupDateFieldValue();
    const dropoffDate = await carSearchPage.getDropoffDateFieldValue();

    await searchPage.waitAndClickSearchButton();

    const retryResult = await retryCarSearchByChangingDatesOnNoResults(page, {
      pickupIndex,
      dropoffIndex,
      maxRetries,
    });

    return { searched: true, place, monthsAhead, pickupIndex, dropoffIndex, pickupDate, dropoffDate, pickupTime, dropoffTime, noResultsRetry: retryResult };
  },

  /**
   * Searches for a car whose rental crosses a month boundary: pick-up on the LAST day of the month
   * `monthsAhead` from now, drop-off on the FIRST day of the month after (e.g. 30 Nov -> 01 Dec).
   *
   * Picks the exact calendar days instead of the nth-available strategy, and deliberately has NO
   * no-results retry: the retry shifts both dates, which would quietly drop the month transition
   * this search exists to exercise. A no-results outcome fails loudly instead.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string|Object} placeInput - Location or location object
   * @param {number} [monthsAhead=1] - Which month's last day is the pick-up (0 = this month).
   *   Default 1 keeps the pick-up at least a few weeks out whatever day the test runs.
   * @returns {Promise<{searched: boolean, place: string, pickupDate: Date, dropoffDate: Date}>}
   * @throws {Error} If the picker did not commit the target dates, or the search returned no results
   */
  async searchCarAcrossMonthTransition(page, placeInput, monthsAhead = 1) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!placeInput) {
      throw new Error(`placeInput must be a non-empty location string or object, got: ${JSON.stringify(placeInput)}`);
    }

    if (!Number.isInteger(monthsAhead) || monthsAhead < 0) {
      throw new Error(`monthsAhead must be a non-negative integer, got ${monthsAhead}`);
    }

    const place = resolveLocation(placeInput, ["place", "location"]);

    const today = new Date();
    // Day 0 of a month is the last day of the month before it.
    const pickupDate = new Date(today.getFullYear(), today.getMonth() + monthsAhead + 1, 0);
    const dropoffDate = new Date(today.getFullYear(), today.getMonth() + monthsAhead + 1, 1);

    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await carSearchPage.clickCarTab();
    await searchPage.fillInOrField(place, 1);

    await searchPage.clickPickupDateField();
    const pickupMonthTableIndex = await advanceSinglePickerCalendarUntilMonthVisible(page, pickupDate);
    await clickDayInVisibleMonth(page, pickupDate, pickupMonthTableIndex);

    await carSearchPage.clickDropoffDateField();
    const dropoffMonthTableIndex = await advanceSinglePickerCalendarUntilMonthVisible(page, dropoffDate);
    await clickDayInVisibleMonth(page, dropoffDate, dropoffMonthTableIndex);

    // Guard against a test-side picking error before blaming the app: the form inputs must show
    // the two target days before Search is clicked.
    const pickupFieldValue = await carSearchPage.getPickupDateFieldValue();
    const dropoffFieldValue = await carSearchPage.getDropoffDateFieldValue();
    if (!dayAndMonthMatch(pickupFieldValue, pickupDate) || !dayAndMonthMatch(dropoffFieldValue, dropoffDate)) {
      throw new Error(
        `[CarSearch.searchCarAcrossMonthTransition] The search form did not commit the target dates. ` +
        `Expected pick-up ${pickupDate.toDateString()} and drop-off ${dropoffDate.toDateString()}, ` +
        `but the fields show "${pickupFieldValue}" and "${dropoffFieldValue}".`,
      );
    }

    logger.info("Searching for a car across a month transition", {
      place,
      pickupDate: pickupDate.toDateString(),
      dropoffDate: dropoffDate.toDateString(),
    });
    await searchPage.waitAndClickSearchButton();

    const status = await resultsPage.waitForCarResultsOrNoResults(60000);
    if (status !== "results") {
      throw new Error(
        `[CarSearch.searchCarAcrossMonthTransition] No car results at "${place}" for ` +
        `${pickupDate.toDateString()} -> ${dropoffDate.toDateString()}. The dates are not retried on ` +
        `purpose (a retry would lose the month transition) — treat this as an environment/supplier issue.`,
      );
    }

    return { searched: true, place, pickupDate, dropoffDate };
  },

  /**
   * Fills the car search form and clicks Search, WITHOUT waiting for car results.
   *
   * Used by regression scenarios where the search is intentionally expected to be blocked â€”
   * e.g. when an empty traveler slot is present, trip-index.handleSearch() emits
   * showTravelersErrorTooltip and returns without navigating, so no results ever load.
   * Polling for results (as searchCarByPlace does) would time out; this method stops right
   * after the Search click so the caller can assert on the resulting validation state.
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} placeInput - Location or location object
   * @param {number} monthsAhead - Number of months ahead to search
   * @param {Object} options
   * @param {number} options.pickupIndex - Pickup date index (>= 0)
   * @param {number} options.dropoffIndex - Drop-off date index (>= 0)
   * @param {string} [options.pickupTime] - Explicit pick-up time "HH:mm" (24h, zero-padded).
   *   Defaults to the form's own pre-filled time when omitted.
   * @param {string} [options.dropoffTime] - Explicit drop-off time "HH:mm" (24h, zero-padded).
   *   Defaults to the form's own pre-filled time when omitted.
   */
  async initiateCarSearch(
    page,
    placeInput = carLocations.defaultLocation,
    monthsAhead = 1,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
      pickupTime,
      dropoffTime,
    } = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }
    if (pickupIndex < 0) {
      throw new Error(`pickupIndex must be >= 0, got ${pickupIndex}`);
    }
    if (dropoffIndex < 0) {
      throw new Error(`dropoffIndex must be >= 0, got ${dropoffIndex}`);
    }

    const place = resolveLocation(placeInput, ["place", "location"], carLocations);

    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await carSearchPage.clickCarTab();
    await searchPage.fillInOrField(place, 1);

    // Pickup date
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow(monthsAhead);
    await selectDatesByNthAvailable(page, { startIndex: pickupIndex, endIndex: null });

    // Drop-off date
    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
    await selectDatesByNthAvailable(page, { startIndex: dropoffIndex, endIndex: null });

    if (pickupTime) {
      const [hour, minute] = parseHourMinute(pickupTime, 'pickupTime');
      await carSearchPage.setTimeFieldTo('pickup', hour, minute);
    }

    if (dropoffTime) {
      const [hour, minute] = parseHourMinute(dropoffTime, 'dropoffTime');
      await carSearchPage.setTimeFieldTo('dropoff', hour, minute);
    }

    // Capture the selected pickup/drop-off dates while the form is still open, before the
    // search click. Mirrors searchCarByPlace so single-PNR scenarios can align a follow-on
    // flight search to the car rental dates even when the car search doesn't wait for results.
    const pickupDate = await carSearchPage.getPickupDateFieldValue();
    const dropoffDate = await carSearchPage.getDropoffDateFieldValue();

    // Submit â€” do NOT wait for results; the search is expected to be blocked by validation.
    await searchPage.waitAndClickSearchButton();

    return { searched: true, place, monthsAhead, pickupIndex, dropoffIndex, pickupDate, dropoffDate, pickupTime, dropoffTime };
  },

  /**
   * Searches for a car from the cart's edit-search drawer (opened by the Car tile in the trip
   * cart's product carousel).
   *
   * Deliberately sets NO location: the car edit-search drawer exposes no location input at all â€”
   * it inherits the pick-up location from the trip context, and its readiness signal is the
   * "Pick-up Date" field precisely because there is no autocomplete to wait for (see
   * SearchPage.SELECTORS.EDIT_CAR_PICKUP_DATE / waitForEditSearchDrawerReady). Only the dates are
   * settable here, so this method sets those and submits through the drawer's own primary button.
   * Use searchCarByPlace when the location must be chosen â€” that requires the standalone search page.
   *
   * @param {Object} page - Playwright page instance
   * @param {number} monthsAhead - Number of months ahead to advance the pick-up calendar
   * @param {Object} options - Search configuration
   * @param {number} options.pickupIndex - Pickup date index (>= 0)
   * @param {number} options.dropoffIndex - Drop-off date index (>= 0)
   * @param {number} options.maxRetries - No-results retries (handled on the results page)
   * @param {string} [options.pickupTime] - Explicit pick-up time "HH:mm" (24h, zero-padded).
   *   Defaults to the form's own pre-filled "10:00" when omitted.
   * @param {string} [options.dropoffTime] - Explicit drop-off time "HH:mm" (24h, zero-padded).
   *   Defaults to the form's own pre-filled "10:00" when omitted.
   * @param {number} [options.dropoffMonthAdvance=1] - How many months to advance the drop-off
   *   calendar past the pick-up calendar's month before indexing drop-off days. The drawer
   *   pre-fills both calendars from the trip's existing car search, so the drop-off calendar
   *   already opens on the SAME month as pick-up — advancing 1 (the default) targets a
   *   next-month drop-off, matching the default dropoffIndex's multi-week rental. Pass 0 for a
   *   drop-off date within the same month as pick-up (e.g. a short, explicit-day-gap rental).
   * @returns {Promise<{searched: boolean, monthsAhead: number, pickupIndex: number, dropoffIndex: number, pickupDate: string, dropoffDate: string, noResultsRetry: Object}>}
   * @throws {Error} If page is missing, or pickupIndex/dropoffIndex are negative
   */
  async searchCarFromCartDrawer(
    page,
    monthsAhead = 1,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
      maxRetries = MAX_NO_RESULTS_RETRIES,
      pickupTime,
      dropoffTime,
      dropoffMonthAdvance = 1,
    } = {},
  ) {
    if (!page) {
      throw new Error('[CarSearch.searchCarFromCartDrawer] "page" is required.');
    }
    if (!Number.isFinite(monthsAhead) || monthsAhead < 0) {
      throw new Error(
        `[CarSearch.searchCarFromCartDrawer] "monthsAhead" must be a non-negative number, got: ${typeof monthsAhead} (${monthsAhead})`
      );
    }
    if (pickupIndex < 0) {
      throw new Error(`[CarSearch.searchCarFromCartDrawer] "pickupIndex" must be >= 0, got ${pickupIndex}`);
    }
    if (dropoffIndex < 0) {
      throw new Error(`[CarSearch.searchCarFromCartDrawer] "dropoffIndex" must be >= 0, got ${dropoffIndex}`);
    }
    if (!Number.isInteger(dropoffMonthAdvance) || dropoffMonthAdvance < 0) {
      throw new Error(
        `[CarSearch.searchCarFromCartDrawer] "dropoffMonthAdvance" must be a non-negative integer, got: ${dropoffMonthAdvance}`
      );
    }

    logger.debug('[CarSearch.searchCarFromCartDrawer] Searching for a car from the cart drawer', {
      monthsAhead,
      pickupIndex,
      dropoffIndex,
      dropoffMonthAdvance,
    });

    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    try {
      // The drawer is already scoped to the car product, so there is no product tab to click.
      await searchPage.waitForEditSearchDrawerReady();

      // Pickup date
      await searchPage.clickPickupDateField();
      await searchPage.clickCalendarNextArrow(monthsAhead);
      await selectDatesByNthAvailable(page, { startIndex: pickupIndex, endIndex: null });

      // Drop-off date
      await carSearchPage.clickDropoffDateField();
      if (dropoffMonthAdvance > 0) {
        await carSearchPage.clickDropoffSecondCalendarNextMonthArrow(dropoffMonthAdvance);
      }
      await selectDatesByNthAvailable(page, { startIndex: dropoffIndex, endIndex: null });

      if (pickupTime) {
        const [hour, minute] = parseHourMinute(pickupTime, 'pickupTime');
        await carSearchPage.setTimeFieldTo('pickup', hour, minute);
      }

      if (dropoffTime) {
        const [hour, minute] = parseHourMinute(dropoffTime, 'dropoffTime');
        await carSearchPage.setTimeFieldTo('dropoff', hour, minute);
      }

      // Capture the chosen dates while the drawer is still open and its inputs are populated.
      const pickupDate = await carSearchPage.getPickupDateFieldValue();
      const dropoffDate = await carSearchPage.getDropoffDateFieldValue();

      await searchPage.waitAndClickPrimarySearchButtonFromCart();

      // Retries are driven from the results page, so this is safe for a drawer-originated search.
      const retryResult = await retryCarSearchByChangingDatesOnNoResults(page, {
        pickupIndex,
        dropoffIndex,
        maxRetries,
      });

      return {
        searched: true,
        monthsAhead,
        pickupIndex,
        dropoffIndex,
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
        noResultsRetry: retryResult,
      };
    } catch (err) {
      throw new Error(
        `[CarSearch.searchCarFromCartDrawer] Failed to run a car search from the cart's edit-search ` +
        `drawer (monthsAhead=${monthsAhead}). The Car tile in the cart product carousel must have ` +
        `opened the drawer first, and the trip must supply a pick-up location (the drawer has no ` +
        `location field of its own). Original: ${err.message}`
      );
    }
  },

  /**
   * Searches for a car by place and rental agency.
   * @param {Object} page - Playwright page instance
   * @param {string|Object} placeInput - Location or location object
   * @param {string} agencyName - Rental agency name (required)
   * @param {number} monthsAhead - Number of months ahead to search
   * @param {Object} options - Search configuration
   * @throws {Error} If agencyName is not provided
   */
  async searchCarByPlaceAndRentalAgency(
    page,
    placeInput = carLocations.defaultLocation,
    agencyName,
    monthsAhead = 1,
    options = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!agencyName) {
      throw new Error(
        "searchCarByPlaceAndRentalAgency requires \"agencyName\"",
      );
    }

    const carSearchPage = getPageObject(page, CarSearchPage);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    // Reuse the main search flow
    return CarSearch.searchCarByPlace(page, placeInput, monthsAhead, options);
  },

  /**
   * Fills the car search form with a rental agency filter and clicks Search, WITHOUT waiting for
   * car results.
   *
   * The agency-filtered twin of initiateCarSearch: use it when the search is gated by a popup that
   * must be handled before results can load â€” e.g. a mandatory TRIP PURPOSE reference field, where
   * searchCarByPlaceAndRentalAgency would poll for results that never arrive until the popup is
   * proceeded. Follow this with the popup step; the add-to-cart step waits for the results itself.
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} placeInput - Location or location object
   * @param {string} agencyName - Rental agency name (required)
   * @param {number} monthsAhead - Number of months ahead to search
   * @param {Object} options - Search configuration (pickupIndex / dropoffIndex)
   * @returns {Promise<{searched: boolean, place: string, monthsAhead: number, pickupIndex: number, dropoffIndex: number, pickupDate: string, dropoffDate: string}>}
   * @throws {Error} If page or agencyName is not provided
   */
  async initiateCarSearchWithRentalAgency(
    page,
    placeInput = carLocations.defaultLocation,
    agencyName,
    monthsAhead = 1,
    options = {},
  ) {
    if (!page) {
      throw new Error('[CarSearch.initiateCarSearchWithRentalAgency] "page" is required.');
    }

    if (!agencyName || typeof agencyName !== 'string') {
      throw new Error(
        `[CarSearch.initiateCarSearchWithRentalAgency] "agencyName" must be a non-empty string, got: ${typeof agencyName} (${agencyName})`
      );
    }

    logger.debug('[CarSearch.initiateCarSearchWithRentalAgency] Initiating an agency-filtered car search without waiting for results', {
      agencyName,
      monthsAhead,
    });

    const carSearchPage = getPageObject(page, CarSearchPage);

    // The agency field only exists on the car tab, so the tab must be active before filtering.
    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    // Reuse the non-blocking search flow â€” it re-clicks the car tab harmlessly and leaves the
    // agency filter in place.
    return CarSearch.initiateCarSearch(page, placeInput, monthsAhead, options);
  },

  /**
   * Searches for a car with different pickup and drop-off locations.
   * @param {Object} page - Playwright page instance
   * @param {string|Object} pickUpLocation - Pickup location
   * @param {string|Object} dropOffLocation - Drop-off location
   * @param {Object} options - Search configuration
   * @param {number} options.pickupIndex - Pickup date index (>= 0)
   * @param {number} options.dropoffIndex - Drop-off date index (>= 0)
   * @param {number} monthsAhead - Number of months ahead to search
   * @throws {Error} If page, pickUpLocation, or dropOffLocation are missing
   * @throws {Error} If pickupIndex or dropoffIndex are negative
   */
  async searchCarWithDifferentDropoffLocation(
    page,
    pickUpLocation,
    dropOffLocation,
    monthsAhead = 1,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
    } = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!pickUpLocation) {
      throw new Error('pickUpLocation is required');
    }

    if (!dropOffLocation) {
      throw new Error('dropOffLocation is required');
    }

    if (pickupIndex < 0) {
      throw new Error(`pickupIndex must be >= 0, got ${pickupIndex}`);
    }

    if (dropoffIndex < 0) {
      throw new Error(`dropoffIndex must be >= 0, got ${dropoffIndex}`);
    }

    const pickupPlace = resolveLocation(
      pickUpLocation,
      ["place", "location"],
      carLocations,
    );

    const dropoffPlace = resolveLocation(
      dropOffLocation,
      ["place", "location"],
      carLocations,
    );

    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await carSearchPage.clickCarTab();
    
    // Fill pickup location
    await searchPage.fillInOrField(pickupPlace, 1);

    // Enable different drop-off location
    await carSearchPage.clickDropoffDifferentLocationCheckbox();

    // Pickup date
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow(monthsAhead);

    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    // Fill drop-off location
    await searchPage.fillInOrField(dropoffPlace, 2);

    // Drop-off date
    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: dropoffIndex,
      endIndex: null,
    });

    await searchPage.waitAndClickSearchButton();

    const retryResult = await retryCarSearchByChangingDatesOnNoResults(page, {
      pickupIndex,
      dropoffIndex,
    });

    return { searched: true, pickupPlace, dropoffPlace, monthsAhead, pickupIndex, dropoffIndex, noResultsRetry: retryResult };
  },

  /**
   * Searches for a car with different pickup and drop-off locations, filtered by a rental agency.
   *
   * The agency-filtered twin of searchCarWithDifferentDropoffLocation: the agency field only exists
   * on the car tab, so the tab is activated and the agency picked before the location/date flow
   * runs. The delegated search re-clicks the car tab harmlessly and leaves the filter in place.
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} pickUpLocation - Pickup location
   * @param {string|Object} dropOffLocation - Drop-off location
   * @param {string} agencyName - Rental agency name (required)
   * @param {number} monthsAhead - Number of months ahead to search
   * @param {Object} options - Search configuration (pickupIndex / dropoffIndex)
   * @returns {Promise<{searched: boolean, pickupPlace: string, dropoffPlace: string, monthsAhead: number, pickupIndex: number, dropoffIndex: number, noResultsRetry: Object}>}
   * @throws {Error} If page or agencyName is not provided
   */
  async searchCarWithDifferentDropoffLocationAndRentalAgency(
    page,
    pickUpLocation,
    dropOffLocation,
    agencyName,
    monthsAhead = 1,
    options = {},
  ) {
    if (!page) {
      throw new Error('[CarSearch.searchCarWithDifferentDropoffLocationAndRentalAgency] "page" is required.');
    }

    if (!agencyName || typeof agencyName !== 'string') {
      throw new Error(
        `[CarSearch.searchCarWithDifferentDropoffLocationAndRentalAgency] "agencyName" must be a non-empty string, got: ${typeof agencyName} (${agencyName})`
      );
    }

    logger.debug('[CarSearch.searchCarWithDifferentDropoffLocationAndRentalAgency] Searching with an agency filter and a different drop-off location', {
      agencyName,
      monthsAhead,
    });

    const carSearchPage = getPageObject(page, CarSearchPage);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    return CarSearch.searchCarWithDifferentDropoffLocation(
      page,
      pickUpLocation,
      dropOffLocation,
      monthsAhead,
      options,
    );
  },

  /**
   * Edits an existing car search with different pickup and drop-off locations.
   * @param {Object} page - Playwright page instance
   * @param {string|Object} pickUpLocation - Pickup location
   * @param {string|Object} dropOffLocation - Drop-off location
   * @param {number} monthsAhead - Number of months ahead to search
   * @param {Object} options - Search configuration
   * @param {number} options.pickupIndex - Pickup date index (>= 0)
   * @param {number} options.dropoffIndex - Drop-off date index (>= 0)
   * @throws {Error} If page, pickUpLocation, or dropOffLocation are missing
   */
  async editCarSearchWithDifferentDropoffLocation(
    page,
    pickUpLocation,
    dropOffLocation,
    monthsAhead = 0,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
    } = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!pickUpLocation) {
      throw new Error('pickUpLocation is required');
    }

    if (!dropOffLocation) {
      throw new Error('dropOffLocation is required');
    }

    const pickupPlace = resolveLocation(
      pickUpLocation,
      ["place", "location"],
      carLocations,
    );

    const dropoffPlace = resolveLocation(
      dropOffLocation,
      ["place", "location"],
      carLocations,
    );

    if (pickupIndex < 0) {
      throw new Error(`pickupIndex must be >= 0, got ${pickupIndex}`);
    }

    if (dropoffIndex < 0) {
      throw new Error(`dropoffIndex must be >= 0, got ${dropoffIndex}`);
    }

    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);
    const resultsPage = getPageObject(page, ResultsPage);
    
    await resultsPage.clickEditButton();

    // Fill pickup location
    await searchPage.fillInOrField(pickupPlace, 1);

    // Pickup date
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow(monthsAhead);

    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    // Fill drop-off location
    await searchPage.fillInOrField(dropoffPlace, 2);

    // Drop-off date
    await carSearchPage.clickDropoffDateField();

    await selectDropoffDateWithFallback(page, carSearchPage, dropoffIndex);
    await ensureDropoffAfterPickup(page, carSearchPage, dropoffIndex);

    await searchPage.waitAndClickSearchButton();

    return { searched: true, pickupPlace, dropoffPlace, monthsAhead, pickupIndex, dropoffIndex };
  },

  /**
   * Edits an existing car search to a new pickup/drop-off location, leaving the rental dates
   * untouched. Unlike editCarSearchWithDifferentDropoffLocation (which always drives both date
   * pickers), this only fills the location field and re-submits — for scenarios that need a
   * second car at a different place on the SAME dates as the first search.
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} newLocation - New pickup/drop-off location
   * @throws {Error} If page or newLocation are missing
   * @returns {Promise<{searched: boolean, place: string}>}
   */
  async editCarSearchLocation(page, newLocation) {
    if (!page) {
      throw new Error('[CarSearch.editCarSearchLocation] "page" is required.');
    }

    if (!newLocation) {
      throw new Error('[CarSearch.editCarSearchLocation] "newLocation" is required.');
    }

    const place = resolveLocation(
      newLocation,
      ["place", "location"],
      carLocations,
    );

    logger.debug('[CarSearch.editCarSearchLocation] Editing car search location without changing dates', { place });

    const searchPage = getPageObject(page, SearchPage);
    const cartPage = getPageObject(page, CartPage);
    const carSearchPage = getPageObject(page, CarSearchPage);

    try {
      // Opens the cart's "Add more services" > Car drawer (car-search-inputs.vue). The drawer
      // pre-fills pickup/dropoff dates from the trip's existing car search, so leaving the date
      // fields untouched and only replacing the destination is what keeps dates unchanged.
      await cartPage.clickAddCarFromCarousel();
      await searchPage.waitForEditSearchDrawerReady();
      await carSearchPage.setCarSearchFormDestination(place);
      await searchPage.waitAndClickPrimarySearchButtonFromCart();
    } catch (err) {
      throw new Error(
        `[CarSearch.editCarSearchLocation] Failed to edit the car search to "${place}" without changing dates. Original: ${err.message}`
      );
    }

    return { searched: true, place };
  },

  // ===== SUGGESTED CAR SEARCH (cross-sell from trip overview) =====

  /**
   * Verifies the car-rental cross-sell suggestion is displayed on the trip overview after a
   * flight is added. The suggestion card is identified by its car product icon (language-
   * independent) and its title should read "Add car rental in <city>".
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is not provided
   * @returns {Promise<void>}
   */
  async verifySuggestedCarCrossSellDisplayed(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    await expect(
      cartPage.getCarCrossSellSuggestion(),
      'The car-rental cross-sell suggestion should be displayed on the trip overview after adding a flight.',
    ).toBeVisible({ timeout: 15000 });

    await expect(
      cartPage.getCarCrossSellSuggestionTitle(),
      'The car cross-sell suggestion title should read "Add car rental in <city>".',
    ).toContainText('Add car rental in', { timeout: 15000 });
  },

  /**
   * Opens the pre-filled car search form by clicking the cross-sell suggestion action, then
   * waits for the trip edit-search drawer to become visible.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is not provided
   * @returns {Promise<void>}
   */
  async openSuggestedCarSearchForm(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const searchPage = getPageObject(page, SearchPage);

    await cartPage.clickCarCrossSellSuggestionAction();
    await searchPage.waitForEditSearchDrawerVisible();
  },

  /**
   * Verifies the car search form is displayed inside the edit-search drawer, confirming its
   * distinguishing "Drop-off at a different location" option is present.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is not provided
   * @returns {Promise<void>}
   */
  async verifyCarSearchFormDisplayed(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const carSearchPage = getPageObject(page, CarSearchPage);

    await expect(
      carSearchPage.getCarSearchForm(),
      'The car search form (.car-search-inputs) should be displayed after opening the cross-sell suggestion.',
    ).toBeVisible({ timeout: 15000 });

    await expect(
      carSearchPage.getDropoffDifferentLocationLabel(),
      'The car search form should show the "Drop-off at a different location" option.',
    ).toBeVisible({ timeout: 15000 });
  },

  /**
   * Verifies the car search form destination (pre-filled pick-up location) contains the expected
   * city. The field is pre-filled with the flight's arrival city; the displayed value is the
   * location's name (e.g. "Manchester"), so the match is a case-insensitive substring check.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedDestination - Expected destination text (city name or code, e.g. "MAN")
   * @throws {Error} If page or expectedDestination are invalid
   * @returns {Promise<{expectedDestination: string, actualDestination: string}>}
   */
  async verifyCarSearchFormDestination(page, expectedDestination) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedDestination || typeof expectedDestination !== 'string') {
      throw new Error(`expectedDestination must be a non-empty string, got: ${typeof expectedDestination}`);
    }

    const carSearchPage = getPageObject(page, CarSearchPage);
    const actualDestination = await carSearchPage.getCarSearchFormDestinationValue();

    expect(
      actualDestination.toLowerCase(),
      `Expected the car search form destination to contain "${expectedDestination}", but the pick-up field showed "${actualDestination}". ` +
        `The flight's arrival city may not have pre-filled the car search.`,
    ).toContain(expectedDestination.toLowerCase());

    return { expectedDestination, actualDestination };
  },

  // ========================================
  // DELIVERY & COLLECTION (ADO 84136 / 84137)
  // ========================================

  /**
   * Opens the car search tab and waits for the car form.
   *
   * @param {import('playwright').Page} page
   */
  async openCarSearch(page) {
    if (!page) throw new Error('page is required');
    const carSearchPage = getPageObject(page, CarSearchPage);
    await carSearchPage.clickCarTab();
    await expect(carSearchPage.getCarSearchForm(), 'The car search form should be displayed').toBeVisible({ timeout: 30000 });
  },

  /**
   * Ticks "Drop-off at a different location" and waits for the drop-off location field.
   *
   * @param {import('playwright').Page} page
   */
  async clickDropoffAtDifferentLocation(page) {
    if (!page) throw new Error('page is required');
    const carSearchPage = getPageObject(page, CarSearchPage);
    await carSearchPage.clickDropoffDifferentLocationCheckbox();
    await expect(
      carSearchPage.getLocationFieldInput('drop-off'),
      'The drop-off location field should appear after ticking "Drop-off at a different location"',
    ).toBeVisible({ timeout: 10000 });
  },

  /**
   * Verifies the Delivery & Collection toggle is shown and starts switched off. It renders only
   * when the agreement in effect has "Allow D&C" enabled in GTP Admin (ADO 84136).
   *
   * @param {import('playwright').Page} page
   */
  async expectDeliveryCollectionToggleShownAndOff(page) {
    if (!page) throw new Error('page is required');
    const carSearchPage = getPageObject(page, CarSearchPage);
    await expect(
      carSearchPage.getDeliveryCollectionToggle(),
      'The "Delivery & Collection" toggle should be shown in car search: the traveller\'s Amadeus car agreement has ' +
        '"Allow D&C" enabled. A hidden toggle means the setting was not applied (GET /cardeliverycollection returned false)',
    ).toBeVisible({ timeout: 30000 });
    expect(await carSearchPage.isDeliveryCollectionSwitchOn(), 'The "Delivery & Collection" toggle should be off by default').toBe(false);
  },

  /**
   * Switches the Delivery & Collection toggle to the requested state.
   *
   * @param {import('playwright').Page} page
   * @param {boolean} on
   */
  async setDeliveryCollectionToggle(page, on) {
    if (!page) throw new Error('page is required');
    if (typeof on !== 'boolean') throw new Error(`on must be a boolean, got: ${typeof on}`);
    const carSearchPage = getPageObject(page, CarSearchPage);
    if ((await carSearchPage.isDeliveryCollectionSwitchOn()) !== on) {
      await carSearchPage.clickDeliveryCollectionSwitch();
    }
    await expect.poll(() => carSearchPage.isDeliveryCollectionSwitchOn(), {
      message: `The "Delivery & Collection" toggle should be ${on ? 'on' : 'off'}`,
      timeout: 10000,
    }).toBe(on);
  },

  /**
   * Verifies which location search a car location field uses. D&C on: the D&C address search
   * (car-dc-autocomplete); off: the standard airport/city search (car-autocomplete).
   *
   * @param {import('playwright').Page} page
   * @param {"pick-up"|"drop-off"} side
   * @param {"delivery and collection"|"standard"} kind
   * @param {{ expectEmpty?: boolean }} [options] - also assert the field holds no location
   */
  async expectLocationFieldSearchKind(page, side, kind, { expectEmpty = false } = {}) {
    if (!page) throw new Error('page is required');
    if (!['pick-up', 'drop-off'].includes(side)) throw new Error(`side must be "pick-up" or "drop-off", got: ${side}`);
    if (!['delivery and collection', 'standard'].includes(kind)) {
      throw new Error(`kind must be "delivery and collection" or "standard", got: ${kind}`);
    }
    const carSearchPage = getPageObject(page, CarSearchPage);
    const dcField = carSearchPage.getDcLocationField(side);
    const standardField = carSearchPage.getStandardLocationField(side);
    const [shown, hidden] = kind === 'standard' ? [standardField, dcField] : [dcField, standardField];

    await expect(shown, `The ${side} field should use the ${kind} location search`).toBeVisible({ timeout: 10000 });
    await expect(hidden, `The ${side} field should not show the other location search`).toHaveCount(0);
    if (expectEmpty) {
      expect(
        await carSearchPage.getLocationFieldValue(side),
        `Switching the D&C toggle should clear the ${side} location picked before`,
      ).toBe('');
    }
  },

  /**
   * Types into a D&C location field. From 3 characters the app queries /cardcautocomplete; the
   * reply is returned so callers can check what the server offered, not only what is rendered.
   *
   * @param {import('playwright').Page} page
   * @param {"pick-up"|"drop-off"} side
   * @param {string} text
   * @returns {Promise<{text: string, places: object[]|null}>} places is null below 3 characters
   */
  async typeInDcLocation(page, side, text) {
    if (!page) throw new Error('page is required');
    if (typeof text !== 'string' || !text) throw new Error(`text must be a non-empty string, got: ${text}`);
    const carSearchPage = getPageObject(page, CarSearchPage);

    if (text.trim().length < DC_MIN_CHARS_FOR_SEARCH) {
      await carSearchPage.typeInDcLocationField(side, text);
      return { text, places: null };
    }

    const replyPromise = carSearchPage.waitForDcAutocompleteResponse(text);
    await carSearchPage.typeInDcLocationField(side, text);
    const reply = await replyPromise;
    expect(reply.status(), `GET /cardcautocomplete for "${text}" should succeed`).toBe(200);
    const places = await reply.json();
    expect(Array.isArray(places), '/cardcautocomplete should reply with a list of places').toBe(true);
    logger.info('D&C autocomplete replied', { side, text, places: places.length });
    return { text, places };
  },

  /**
   * Verifies the D&C dropdown shows no suggestions (fewer than 3 characters, or no match).
   *
   * @param {import('playwright').Page} page
   */
  async expectNoDcSuggestions(page) {
    if (!page) throw new Error('page is required');
    const carSearchPage = getPageObject(page, CarSearchPage);
    // Give a late dropdown the chance to appear, so "none" is not read before rendering.
    await page.waitForTimeout(DC_NO_SUGGESTIONS_SETTLE_MS);
    await expect(carSearchPage.getDcSuggestionRows(), 'No Delivery & Collection location suggestions should be shown').toHaveCount(0);
  },

  /**
   * Verifies the D&C suggestions shown match the server reply, row for row: each row reads
   * "address, city, country" for its place and carries a location-type icon.
   *
   * @param {import('playwright').Page} page
   * @param {object[]} places - The /cardcautocomplete reply for the text typed
   */
  async expectDcSuggestionsMatchReply(page, places) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(places) || places.length === 0) {
      throw new Error('places must be the non-empty /cardcautocomplete reply for the text typed');
    }
    const carSearchPage = getPageObject(page, CarSearchPage);
    await expect(carSearchPage.getDcSuggestionRows().first(), 'Delivery & Collection location suggestions should be shown').toBeVisible({ timeout: 15000 });
    const rows = await carSearchPage.readDcSuggestionRows();

    expect(rows.length, 'The dropdown should show at most the places the server returned').toBeLessThanOrEqual(places.length);
    rows.forEach((row, index) => {
      expect(normalizeTextLoose(row.text), `Suggestion ${index + 1} should read "address, city, country" for its place`)
        .toBe(normalizeTextLoose(toDcPlaceDisplayName(places[index])));
      expect(row.hasIcon, `Suggestion ${index + 1} ("${row.text}") should show a location-type badge`).toBe(true);
    });
    return { rows };
  },

  /**
   * Verifies a /cardcautocomplete reply offers no Hertz location and lists each place once.
   *
   * @param {object[]} places
   */
  expectDcPlacesExcludeHertzAndAreUnique(places) {
    if (!Array.isArray(places) || places.length === 0) {
      throw new Error('places must be the non-empty /cardcautocomplete reply for the text typed');
    }
    const hertzPlaces = places.filter((place) => (place.providers || []).some((provider) => provider.providerCode === HERTZ_PROVIDER_CODE));
    expect(
      hertzPlaces.map((place) => place.placeId),
      `No D&C place should offer Hertz (${HERTZ_PROVIDER_CODE}) in this phase`,
    ).toEqual([]);

    const placeIds = places.map((place) => place.placeId);
    const duplicates = placeIds.filter((id, index) => placeIds.indexOf(id) !== index);
    expect(duplicates, 'Each D&C place should be listed once, grouped across providers').toEqual([]);
    expect(
      places.filter((place) => !(place.providers || []).length).map((place) => place.placeId),
      'Every D&C place should have at least one eligible provider',
    ).toEqual([]);
  },

  /**
   * Selects a D&C suggestion and returns the place it stands for.
   *
   * @param {import('playwright').Page} page
   * @param {"pick-up"|"drop-off"} side
   * @param {object[]} places - The reply the dropdown was built from
   * @param {number} [index=0]
   * @returns {Promise<object>} The selected place
   */
  async selectDcSuggestion(page, side, places, index = 0) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(places) || !places[index]) throw new Error(`No D&C place at index ${index} in the reply`);
    const carSearchPage = getPageObject(page, CarSearchPage);
    await carSearchPage.clickDcSuggestionAt(index);
    const place = places[index];
    await expect.poll(async () => normalizeTextLoose(await carSearchPage.getLocationFieldValue(side)), {
      message: `The ${side} field should show the selected D&C place`,
      timeout: 10000,
    }).toBe(normalizeTextLoose(toDcPlaceDisplayName(place)));
    logger.info('Selected D&C place', { side, placeId: place.placeId, latitude: place.latitude, longitude: place.longitude });
    return place;
  },

  /**
   * Picks the dates and clicks Search with the locations already set on the form (used after a
   * D&C place was selected, where the standard place-typing search methods do not apply).
   *
   * @param {import('playwright').Page} page
   * @param {number} [monthsAhead=1]
   */
  async searchWithDatesForSelectedLocation(page, monthsAhead = 1) {
    if (!page) throw new Error('page is required');
    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow(monthsAhead);
    await selectDatesByNthAvailable(page, { startIndex: SEARCH_DEFAULTS.CAR.PICKUP_INDEX, endIndex: null });
    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
    await selectDatesByNthAvailable(page, { startIndex: SEARCH_DEFAULTS.CAR.DROPOFF_INDEX, endIndex: null });
    await searchPage.waitAndClickSearchButton();
  },
};

module.exports = CarSearch;
