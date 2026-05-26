const { getPageObject } = require("@utils/pageObjectCache");
const ManualQuoteSearchPage = require("@pages/ManualQuoteSearchPage");
const FlightSearchPage = require("@pages/FlightSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const flightRoutes = require("@data/flights.json");
const { selectDatesByNthAvailable, selectDateAfterAdvancingMonths } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const logger = require("@utils/logger").child("ManualQuoteSearch-DSL");

/**
 * DSL for Manual Quote Search functionality.
 * Provides business-level methods for creating manual flight quotes.
 */
const ManualQuoteSearch = {
  /**
   * Performs a complete manual quote search for a flight.
   * Fills in route, dates, carrier details, and adds the quote to the trip.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} routeInput - Route identifier (e.g., "LHR-JFK")
   * @param {number} departureIndex - Index of departure date in calendar
   * @param {number} returnIndex - Index of return date in calendar
   */
  async searchAndAddFlightManualQuote(
    page,
    routeInput = flightRoutes.defaultRoute,
    departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
  ) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");
    logger.info("Starting manual quote flight search", { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    // Navigate to the manual quote flight tab
    await manualQuoteSearchPage.clickManualQuoteTab();
    await manualQuoteSearchPage.waitForEnterAirportLocationPlaceholderVisible();
    await flightSearchPage.clickFlightTab();

    // Fill in route details
    await manualQuoteSearchPage.fillInDepartingFromField(from);
    await manualQuoteSearchPage.fillInArrivingToField(to);
    await manualQuoteSearchPage.typeFlightNumber("765");

    // Select departure date
    await manualQuoteSearchPage.clickDepartingDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null, // Single date selection for departure
    });

    // Select return date (5 days after the outbound) in the separate returning-date picker.
    // The two date fields each open their own Element-Plus calendar, so the return date
    // cannot be selected as a range with the departure — it requires a fresh picker.
    const returnDateIndex = departureIndex + 5;
    await manualQuoteSearchPage.clickReturningDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: returnDateIndex,
      endIndex: null,
      pickerPosition: "last",
    });

    // Fill in carrier details
    await manualQuoteSearchPage.typeCarrierLocator("TP");
    await manualQuoteSearchPage.typeCarrierName("TAP Air Portugal (TP)");
    await manualQuoteSearchPage.clickCarrierDropdownOption("TAP Air Portugal (TP)");

    // Set default times (required by UI to enable submission)
    await manualQuoteSearchPage.clickStartTime();
    await manualQuoteSearchPage.clickEndTime();

    // Enter pricing and add quote to cart
    await manualQuoteSearchPage.typeBaseFare("10");
    await manualQuoteSearchPage.clickAddQuoteButton();
  },

  /**
   * Adds a hotel manual quote using the "Enter details manually" mode.
   * Fills the minimum required fields (hotel name, address, city, dates,
   * number of rooms, cancellation policy, confirmation, room description,
   * base fare) and submits the quote.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} city - City text used in the address autocomplete (e.g. "Portland")
   * @param {Object} [options]
   * @param {number} [options.numberOfRooms=4] - Number of rooms to select
   * @param {string} [options.hotelName="Test Hotel"]
   * @param {string} [options.address="123 Main St"]
   * @param {string} [options.confirmationNum="12345"]
   * @param {string} [options.roomDescription="Standard double"]
   * @param {string} [options.cancellationPolicy="48HRS Prior to Arrival"]
   * @param {string|number} [options.baseFare=100]
   * @param {number} [options.checkInIndex=2] - Nth available day in calendar for check-in
   * @param {number} [options.checkOutIndex=5] - Nth available day in calendar for check-out
   */
  async addHotelManualQuote(page, city, options = {}) {
    if (!page) throw new Error("page is required");
    if (typeof city !== "string" || !city.trim()) {
      throw new Error("city must be a non-empty string, got: " + typeof city);
    }
    if (options !== null && typeof options !== "object") {
      throw new Error("options must be an object, got: " + typeof options);
    }

    const {
      numberOfRooms = 4,
      hotelName = "Test Hotel",
      address = "123 Main St",
      confirmationNum = "12345",
      roomDescription = "Standard double",
      cancellationPolicy = "48HRS Prior to Arrival",
      baseFare = 10,
      checkInIndex = 2,
      checkOutIndex = 5,
    } = options;

    if (!Number.isInteger(numberOfRooms) || numberOfRooms < 1) {
      throw new Error(
        "options.numberOfRooms must be a positive integer, got: " + numberOfRooms,
      );
    }

    logger.info("Adding hotel manual quote", { city, numberOfRooms, hotelName });

    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);

    // Navigate to manual quote → Hotel sub-tab
    await manualQuoteSearchPage.clickManualQuoteTab();
    await manualQuoteSearchPage.clickHotelSubTab();
    await manualQuoteSearchPage.waitForHotelFormVisible();

    // Form defaults to "Search location" mode; switch to manual entry so the
    // hotel name / address / dates / rooms fields become visible.
    await manualQuoteSearchPage.selectHotelManualEntryMode();

    // Basic hotel info
    await manualQuoteSearchPage.typeHotelName(hotelName);
    await manualQuoteSearchPage.typeHotelAddress(address);
    await manualQuoteSearchPage.selectHotelCity(city);

    // Check-in / check-out dates. Advance 2 months ahead for each date to
    // avoid past/unavailable days and ensure stability.
    await manualQuoteSearchPage.clickHotelDateInput(0);
    await selectDateAfterAdvancingMonths(page, {
      monthsToAdvance: 2,
      dayIndex: checkInIndex,
    });
    await manualQuoteSearchPage.clickHotelDateInput(1);
    await selectDateAfterAdvancingMonths(page, {
      monthsToAdvance: 2,
      dayIndex: checkOutIndex,
    });

    // Number of rooms (label-scoped)
    await manualQuoteSearchPage.openHotelSelect("numberOfRooms");
    await manualQuoteSearchPage.clickDropdownOptionByText(`${numberOfRooms} Rooms`);

    // Cancellation policy (label-scoped)
    await manualQuoteSearchPage.openHotelSelect("cancellationPolicy");
    await manualQuoteSearchPage.clickDropdownOptionByText(cancellationPolicy);

    // Confirmation + room description
    await manualQuoteSearchPage.typeHotelConfirmationNumber(confirmationNum);
    await manualQuoteSearchPage.typeHotelRoomDescription(roomDescription);

    // Base fare + submit
    await manualQuoteSearchPage.typeHotelBaseFare(baseFare);
    await manualQuoteSearchPage.clickAddQuoteButton();

    return {
      added: true,
      city,
      numberOfRooms,
      hotelName,
      address,
      confirmationNum,
      roomDescription,
      cancellationPolicy,
      baseFare,
    };
  },

  // ===== MANUAL QUOTE PAGE CHROME =====

  async openManualQuotePage(page) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.openManualQuotePage] "page" is required.');
    }
    logger.debug("[ManualQuoteSearch.openManualQuotePage] Opening manual quote page");
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    try {
      await manualQuoteSearchPage.clickManualQuoteTab();
      await manualQuoteSearchPage
        .getPageHeading()
        .waitFor({ state: "visible", timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.openManualQuotePage] Failed to open the manual quote page. ` +
          `The Manual Quote tab was not visible/clickable, or the page heading did not render within 20s — ` +
          `likely the trip page failed to load or the user has no access to manual quotes. Original: ${err.message}`,
      );
    }
  },

  async expectWarningText(page, text) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.expectWarningText] "page" is required.');
    }
    if (typeof text !== "string" || !text.trim()) {
      throw new Error(
        `[ManualQuoteSearch.expectWarningText] "text" must be a non-empty string, got: ${typeof text} (${JSON.stringify(text)})`,
      );
    }
    logger.debug("[ManualQuoteSearch.expectWarningText] Verifying warning text", { text });
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const warning = manualQuoteSearchPage.getWarningTextByContent(text);
    try {
      await warning.waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.expectWarningText] Expected the manual quote page to display the warning "${text}", ` +
          `but it was not visible within 10s. Likely a traveler is already added, or the warning copy changed in the UI. ` +
          `Original: ${err.message}`,
      );
    }
  },

  async expectHeadingContains(page, fragment) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.expectHeadingContains] "page" is required.');
    }
    if (typeof fragment !== "string" || !fragment.trim()) {
      throw new Error(
        `[ManualQuoteSearch.expectHeadingContains] "fragment" must be a non-empty string, got: ${typeof fragment} (${JSON.stringify(fragment)})`,
      );
    }
    logger.debug("[ManualQuoteSearch.expectHeadingContains] Verifying page heading", { fragment });
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const heading = manualQuoteSearchPage.getPageHeading();
    let actual;
    try {
      await heading.waitFor({ state: "visible", timeout: 10000 });
      actual = (await heading.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.expectHeadingContains] Manual quote page heading was not visible within 10s — ` +
          `the page may not have loaded. Original: ${err.message}`,
      );
    }
    if (!actual.toLowerCase().includes(fragment.toLowerCase())) {
      throw new Error(
        `[ManualQuoteSearch.expectHeadingContains] Manual quote page heading does not contain "${fragment}". ` +
          `Actual heading: "${actual}".`,
      );
    }
  },

  async expectBackButtonVisible(page) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.expectBackButtonVisible] "page" is required.');
    }
    logger.debug("[ManualQuoteSearch.expectBackButtonVisible] Verifying Back button is visible");
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const button = manualQuoteSearchPage.getBackButton();
    try {
      await button.waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.expectBackButtonVisible] Back button was not visible within 10s on the manual quote page. ` +
          `Likely the title-container is hidden (mobile view?) or the page did not finish loading. Original: ${err.message}`,
      );
    }
  },

  async clickBack(page) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.clickBack] "page" is required.');
    }
    logger.debug("[ManualQuoteSearch.clickBack] Clicking Back button on manual quote page");
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    try {
      await manualQuoteSearchPage.clickBackButton();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.clickBack] Failed to click the Back button on the manual quote page — ` +
          `the title-container button was not visible/clickable within 10s. Likely the manual quote page did not load. ` +
          `Original: ${err.message}`,
      );
    }
  },

  // ===== CAR MANUAL QUOTE FORM OF PAYMENT =====

  async navigateToCarSearchForm(page) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.navigateToCarSearchForm] "page" is required.');
    }
    logger.debug("[ManualQuoteSearch.navigateToCarSearchForm] Switching to Car sub-tab");
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    try {
      await manualQuoteSearchPage.clickCarTab();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.navigateToCarSearchForm] Failed to switch to the Car sub-tab on the manual quote page — ` +
          `the Car tab was not visible or the pane never rendered. Likely the manual quote page did not load, ` +
          `or the Car product is not enabled for this user. Original: ${err.message}`,
      );
    }
  },

  async scrollToCarFopSection(page) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.scrollToCarFopSection] "page" is required.');
    }
    logger.debug("[ManualQuoteSearch.scrollToCarFopSection] Scrolling Car payment section into view");
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    try {
      await manualQuoteSearchPage.scrollCarPaymentSectionIntoView();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.scrollToCarFopSection] Failed to scroll the Car payment-details section into view — ` +
          `the section was not visible within 10s. Likely the Car tab is not active or the form has not finished rendering. ` +
          `Original: ${err.message}`,
      );
    }
  },

  async openCarFopDropdown(page) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.openCarFopDropdown] "page" is required.');
    }
    logger.debug("[ManualQuoteSearch.openCarFopDropdown] Opening Available credit cards dropdown");
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    try {
      await manualQuoteSearchPage.openCarFopDropdown();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.openCarFopDropdown] Failed to open the "Available credit cards" dropdown in the Car pane — ` +
          `the trigger was not clickable or the dropdown options never appeared. ` +
          `Likely the payment section is not visible or no credit cards are configured for this user. ` +
          `Original: ${err.message}`,
      );
    }
  },

  async expectFopOptionVisible(page, cardName) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.expectFopOptionVisible] "page" is required.');
    }
    if (typeof cardName !== "string" || !cardName.trim()) {
      throw new Error(
        `[ManualQuoteSearch.expectFopOptionVisible] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`,
      );
    }
    logger.debug("[ManualQuoteSearch.expectFopOptionVisible] Checking FOP option visibility", { cardName });
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const option = manualQuoteSearchPage.getVisibleDropdownOptionByText(cardName);
    try {
      await option.waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      let available = [];
      try {
        available = await manualQuoteSearchPage.listVisibleDropdownOptionTexts();
      } catch (listErr) {
        logger.debug(
          "[ManualQuoteSearch.expectFopOptionVisible] Could not enumerate dropdown options for diagnostic",
          { err: listErr.message },
        );
        available = ["<could not enumerate>"];
      }
      throw new Error(
        `[ManualQuoteSearch.expectFopOptionVisible] Expected credit card "${cardName}" to be available in the ` +
          `Car FOP dropdown, but it was not visible within 10s. ` +
          `Available options: [${available.join(", ")}]. ` +
          `Likely the test user does not have this credit card configured, or the dropdown is not the FOP one. ` +
          `Original: ${err.message}`,
      );
    }
  },

  async selectFopOption(page, cardName) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.selectFopOption] "page" is required.');
    }
    if (typeof cardName !== "string" || !cardName.trim()) {
      throw new Error(
        `[ManualQuoteSearch.selectFopOption] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`,
      );
    }
    logger.info("[ManualQuoteSearch.selectFopOption] Selecting FOP credit card", { cardName });
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    try {
      await manualQuoteSearchPage.selectVisibleDropdownOption(cardName);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.selectFopOption] Failed to select FOP credit card "${cardName}" from the Car dropdown — ` +
          `the option was not visible or the dropdown closed before the click. ` +
          `Likely the credit card is not configured for this user, or the dropdown was already closed. ` +
          `Original: ${err.message}`,
      );
    }
  },

  async expectCardTypeDisplayed(page, cardType) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.expectCardTypeDisplayed] "page" is required.');
    }
    if (typeof cardType !== "string" || !cardType.trim()) {
      throw new Error(
        `[ManualQuoteSearch.expectCardTypeDisplayed] "cardType" must be a non-empty string, got: ${typeof cardType} (${JSON.stringify(cardType)})`,
      );
    }
    logger.debug("[ManualQuoteSearch.expectCardTypeDisplayed] Verifying displayed card type", { cardType });
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const actual = await manualQuoteSearchPage.getCarCardTypeDisplayText();
    if (!actual.toLowerCase().includes(cardType.toLowerCase())) {
      throw new Error(
        `[ManualQuoteSearch.expectCardTypeDisplayed] Expected Car card-type field to display "${cardType}", ` +
          `but it shows "${actual}". Likely the selected FOP did not auto-populate the card type, ` +
          `or the credit card was created with a different card type than expected.`,
      );
    }
  },

  async openCardTypeDropdown(page) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.openCardTypeDropdown] "page" is required.');
    }
    logger.debug("[ManualQuoteSearch.openCardTypeDropdown] Opening Card Type dropdown");
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    try {
      await manualQuoteSearchPage.openCarCardTypeDropdown();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.openCardTypeDropdown] Failed to open the Card Type dropdown in the Car pane — ` +
          `the trigger was not clickable or no options appeared. Likely the payment section is hidden. ` +
          `Original: ${err.message}`,
      );
    }
  },

  async expectCardTypesInDropdown(page, expectedList) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.expectCardTypesInDropdown] "page" is required.');
    }
    if (!Array.isArray(expectedList) || expectedList.length === 0) {
      throw new Error(
        `[ManualQuoteSearch.expectCardTypesInDropdown] "expectedList" must be a non-empty array of card-type names, ` +
          `got: ${typeof expectedList} (${JSON.stringify(expectedList)})`,
      );
    }
    logger.debug("[ManualQuoteSearch.expectCardTypesInDropdown] Verifying card types in dropdown", { expectedList });
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const actual = await manualQuoteSearchPage.listVisibleDropdownOptionTexts();
    const actualNormalized = actual.map((t) => t.trim().toLowerCase());
    const missing = expectedList.filter(
      (expected) => !actualNormalized.includes(String(expected).trim().toLowerCase()),
    );
    if (missing.length > 0) {
      throw new Error(
        `[ManualQuoteSearch.expectCardTypesInDropdown] Card-type dropdown is missing expected entries: [${missing.join(", ")}]. ` +
          `Actual options: [${actual.join(", ")}]. ` +
          `Likely the supported card types list changed, or the dropdown is not the Card Type one.`,
      );
    }
    return { actual, expectedList };
  },
};

module.exports = ManualQuoteSearch;
