const CarSearchPage = require("@pages/CarSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveLocation } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger").child("CarSearch");
const carLocations = require("@data/cars.json");

const MAX_NO_RESULTS_RETRIES = 2;

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

    logger.info("No car results found. Retrying by changing dates only in edit search", {
      attempt,
      maxRetries,
      pickupIndex,
      dropoffIndex,
    });

    const noResultsEditButton = resultsPage.getNoResultsEditSearchButton();
    if (await noResultsEditButton.isVisible().catch(() => false)) {
      await noResultsEditButton.click();
    } else {
      await resultsPage.clickEditButton();
    }

    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    await carSearchPage.clickDropoffDateField();
    await selectDropoffDateWithFallback(page, carSearchPage, dropoffIndex);
    await ensureDropoffAfterPickup(page, carSearchPage, dropoffIndex);

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

    await searchPage.waitAndClickSearchButton();

    const retryResult = await retryCarSearchByChangingDatesOnNoResults(page, {
      pickupIndex,
      dropoffIndex,
      maxRetries,
    });

    return { searched: true, place, monthsAhead, pickupIndex, dropoffIndex, noResultsRetry: retryResult };
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
};

module.exports = CarSearch;
