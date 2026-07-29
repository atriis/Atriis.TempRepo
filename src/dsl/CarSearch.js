const { expect } = require("@playwright/test");
const CarSearchPage = require("@pages/CarSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { CartPage } = require("@pages/CartPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveLocation } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger").child("CarSearch");
const carLocations = require("@data/cars.json");

// 2 same-month day-shift attempts, then 1 final month-advance attempt as a last resort.
const MAX_NO_RESULTS_RETRIES = 3;
// How far to shift the pickup/drop-off day index on each non-final no-results retry attempt.
// Shifting within the same visible month keeps the retry search close to the original dates.
const NO_RESULTS_RETRY_DAY_STEP = 3;

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
   * @returns {Promise<{searched: boolean, place: string, monthsAhead: number, pickupIndex: number, dropoffIndex: number, pickupDate: string, dropoffDate: string, noResultsRetry: Object}>} Search result including the selected pickup/drop-off date field values
   * @throws {Error} If pickupIndex or dropoffIndex are negative
   */
  async searchCarByPlace(
    page,
    placeInput = carLocations.defaultLocation,
    monthsAhead = 3,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
      maxRetries = MAX_NO_RESULTS_RETRIES,
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

    return { searched: true, place, monthsAhead, pickupIndex, dropoffIndex, pickupDate, dropoffDate, noResultsRetry: retryResult };
  },

  /**
   * Fills the car search form and clicks Search, WITHOUT waiting for car results.
   *
   * Used by regression scenarios where the search is intentionally expected to be blocked —
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
   */
  async initiateCarSearch(
    page,
    placeInput = carLocations.defaultLocation,
    monthsAhead = 3,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
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

    // Capture the selected pickup/drop-off dates while the form is still open, before the
    // search click. Mirrors searchCarByPlace so single-PNR scenarios can align a follow-on
    // flight search to the car rental dates even when the car search doesn't wait for results.
    const pickupDate = await carSearchPage.getPickupDateFieldValue();
    const dropoffDate = await carSearchPage.getDropoffDateFieldValue();

    // Submit — do NOT wait for results; the search is expected to be blocked by validation.
    await searchPage.waitAndClickSearchButton();

    return { searched: true, place, monthsAhead, pickupIndex, dropoffIndex, pickupDate, dropoffDate };
  },

  /**
   * Searches for a car from the cart's edit-search drawer (opened by the Car tile in the trip
   * cart's product carousel).
   *
   * Deliberately sets NO location: the car edit-search drawer exposes no location input at all —
   * it inherits the pick-up location from the trip context, and its readiness signal is the
   * "Pick-up Date" field precisely because there is no autocomplete to wait for (see
   * SearchPage.SELECTORS.EDIT_CAR_PICKUP_DATE / waitForEditSearchDrawerReady). Only the dates are
   * settable here, so this method sets those and submits through the drawer's own primary button.
   * Use searchCarByPlace when the location must be chosen — that requires the standalone search page.
   *
   * @param {Object} page - Playwright page instance
   * @param {number} monthsAhead - Number of months ahead to advance the pick-up calendar
   * @param {Object} options - Search configuration
   * @param {number} options.pickupIndex - Pickup date index (>= 0)
   * @param {number} options.dropoffIndex - Drop-off date index (>= 0)
   * @param {number} options.maxRetries - No-results retries (handled on the results page)
   * @returns {Promise<{searched: boolean, monthsAhead: number, pickupIndex: number, dropoffIndex: number, pickupDate: string, dropoffDate: string, noResultsRetry: Object}>}
   * @throws {Error} If page is missing, or pickupIndex/dropoffIndex are negative
   */
  async searchCarFromCartDrawer(
    page,
    monthsAhead = 3,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
      maxRetries = MAX_NO_RESULTS_RETRIES,
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

    logger.debug('[CarSearch.searchCarFromCartDrawer] Searching for a car from the cart drawer', {
      monthsAhead,
      pickupIndex,
      dropoffIndex,
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
      await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
      await selectDatesByNthAvailable(page, { startIndex: dropoffIndex, endIndex: null });

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
    monthsAhead = 3,
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
   * must be handled before results can load — e.g. a mandatory TRIP PURPOSE reference field, where
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
    monthsAhead = 3,
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

    // Reuse the non-blocking search flow — it re-clicks the car tab harmlessly and leaves the
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
    monthsAhead = 3,
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
};

module.exports = CarSearch;
