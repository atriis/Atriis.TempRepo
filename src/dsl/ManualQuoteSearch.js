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
   * Performs a complete ROUND-TRIP manual quote flight search.
   *
   * The manual-quote flight form is multi-segment (manual-quote-flight.vue): a round trip
   * is built by filling the outbound leg on segment 0, clicking "Add another flight" to
   * append segment 1, then filling the inbound (return) leg. Contrast with the one-way
   * {@link searchAndAddFlightManualQuote}, which fills a single segment.
   *
   * Each leg departs and ARRIVES on the same calendar day (a realistic same-day flight, not
   * a multi-day gap), and the return leg departs 3 days after the outbound.
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} routeInput - Route identifier or inline { from, to }
   */
  async searchAndAddFlightManualQuoteRoundTrip(page, routeInput = flightRoutes.defaultRoute) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");

    // Exact dates (not "nth available"): the outbound leg ~a month out and the inbound leg 3 days
    // later, each arriving on its own departure day. Same-day legs keep the flight durations
    // realistic; the 3-day gap between them is what the per-diem is computed over.
    const toIsoDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const addDays = (d, days) => {
      const next = new Date(d);
      next.setDate(next.getDate() + days);
      return next;
    };
    const TRIP_LENGTH_DAYS = 3;
    const outboundDay = addDays(new Date(), 30);
    const returnDay = addDays(outboundDay, TRIP_LENGTH_DAYS);

    logger.info("Starting round-trip manual quote flight search", {
      from,
      to,
      outboundDate: toIsoDate(outboundDay),
      returnDate: toIsoDate(returnDay),
    });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);

    // Sets a segment leg's date to an exact day: navigate the open picker to the target month and
    // force-click the day, then read the field back and retry — the app pre-fills segment dates
    // from the previous leg and the lower picker can drop a click, so verification is what keeps
    // the legs the intended days apart.
    const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const setSegmentDate = async (segmentIndex, kind, dateObj) => {
      const day = dateObj.getDate();
      const monthAbbr = MONTH_ABBR[dateObj.getMonth()];
      // The field renders the day zero-padded ("Thu, 01 Oct"), so \b<day>\b never matches a
      // single-digit day. Allow the optional leading zero and bound on non-digits instead, which
      // still keeps 1 from matching the 1 inside 11/21/31.
      const dayPattern = new RegExp(`(?:^|\\D)0?${day}(?:\\D|$)`);
      for (let attempt = 1; attempt <= 3; attempt++) {
        // Close whatever is open BEFORE opening this leg's picker, and let the new panel settle:
        // while two pickers overlap, "the open picker" resolves to one panel for the header read
        // and the other for the arrow click, which sends the month nowhere or years past target.
        await manualQuoteSearchPage.closeAllOpenDatePickers();
        await manualQuoteSearchPage.clickSegmentDate(segmentIndex, kind);
        await manualQuoteSearchPage.waitForSingleOpenDatePicker();
        await manualQuoteSearchPage.navigateOpenPickerToMonth(dateObj);
        await manualQuoteSearchPage.clickDayInOpenPicker(day);
        await manualQuoteSearchPage.closeAllOpenDatePickers();

        const value = await manualQuoteSearchPage.getSegmentDateValue(segmentIndex, kind);
        if (value.includes(monthAbbr) && dayPattern.test(value)) {
          return;
        }
        logger.debug("Segment date did not stick; retrying", {
          segmentIndex, kind, want: `${monthAbbr} ${day}`, got: value, attempt,
        });
      }
      throw new Error(
        `[ManualQuoteSearch.searchAndAddFlightManualQuoteRoundTrip] Could not set segment ${segmentIndex} ` +
        `${kind} date to "${monthAbbr} ${day}" after 3 attempts — the app may be re-syncing segment dates.`,
      );
    };

    // Navigate to the manual quote flight tab
    await manualQuoteSearchPage.clickManualQuoteTab();
    await manualQuoteSearchPage.waitForEnterAirportLocationPlaceholderVisible();
    await flightSearchPage.clickFlightTab();

    // ===== Segment 0 — outbound leg (from -> to), same-day =====
    await manualQuoteSearchPage.fillInDepartingFromField(from);
    await manualQuoteSearchPage.fillInArrivingToField(to);
    await manualQuoteSearchPage.typeFlightNumber("765");

    await setSegmentDate(0, "departing", outboundDay);
    await setSegmentDate(0, "arriving", outboundDay);

    await manualQuoteSearchPage.typeCarrierLocator("TP");
    await manualQuoteSearchPage.typeCarrierName("TAP Air Portugal (TP)");
    await manualQuoteSearchPage.clickCarrierDropdownOption("TAP Air Portugal (TP)");
    await manualQuoteSearchPage.clickStartTime();
    await manualQuoteSearchPage.clickEndTime();

    // ===== Segment 1 — inbound leg (to -> from), same-day, 3 days after the outbound =====
    await manualQuoteSearchPage.clickAddAnotherFlight();

    await manualQuoteSearchPage.fillSegmentDepartingFromField(1, to);
    await manualQuoteSearchPage.fillSegmentArrivingToField(1, from);
    await manualQuoteSearchPage.typeSegmentFlightNumber(1, "766");

    await setSegmentDate(1, "departing", returnDay);
    await setSegmentDate(1, "arriving", returnDay);

    await manualQuoteSearchPage.typeSegmentCarrierLocator(1, "TP");
    await manualQuoteSearchPage.typeSegmentCarrierName(1, "TAP Air Portugal (TP)");
    await manualQuoteSearchPage.clickCarrierDropdownOption("TAP Air Portugal (TP)");
    await manualQuoteSearchPage.clickSegmentTime(1, 0);
    await manualQuoteSearchPage.clickSegmentTime(1, 1);

    // ===== Price + submit =====
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

    // Number of rooms (label-scoped) — UI uses singular "Room" for 1, plural "Rooms" for 2+
    await manualQuoteSearchPage.openHotelSelect("numberOfRooms");
    const roomLabel = numberOfRooms === 1 ? `${numberOfRooms} Room` : `${numberOfRooms} Rooms`;
    await manualQuoteSearchPage.clickDropdownOptionByText(roomLabel);

    // Cancellation policy (label-scoped)
    await manualQuoteSearchPage.openHotelSelect("cancellationPolicy");
    await manualQuoteSearchPage.clickDropdownOptionByText(cancellationPolicy);

    // Confirmation + room description
    await manualQuoteSearchPage.typeHotelConfirmationNumber(confirmationNum);
    await manualQuoteSearchPage.typeHotelRoomDescription(roomDescription);

    // Base fare + submit
    await manualQuoteSearchPage.typeHotelBaseFare(baseFare);
    await manualQuoteSearchPage.clickAddQuoteButton();

    // Verify the form was actually submitted — wait for the hotel form to disappear
    try {
      await page.locator(".manual-quote-hotel").first()
        .waitFor({ state: "hidden", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addHotelManualQuote] Clicked "Add Quote" but the hotel form did not close within 15s — ` +
        `likely a form validation error prevented submission (check city, dates, rooms fields for red borders). ` +
        `Original: ${err.message}`
      );
    }

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

  // ===== OTHER PRODUCTS MANUAL QUOTE =====

  async addOtherProductManualQuote(page, { quoteType, comment = "", baseFare = 10, startDateIndex = 2, endDateIndex = 5 } = {}) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.addOtherProductManualQuote] "page" is required.');
    }
    if (typeof quoteType !== "string" || !quoteType.trim()) {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] "quoteType" must be a non-empty string (e.g., "Per Diem"), got: ${typeof quoteType} (${JSON.stringify(quoteType)})`,
      );
    }
    if (typeof baseFare !== "number" && typeof baseFare !== "string") {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] "baseFare" must be a number or string, got: ${typeof baseFare}`,
      );
    }

    logger.info("Adding Other Product manual quote", { quoteType, comment, baseFare });

    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);

    // Navigate to manual quote → Other Products tab
    try {
      await manualQuoteSearchPage.clickManualQuoteTab();
      await manualQuoteSearchPage.clickOtherProductsTab();
      await manualQuoteSearchPage.waitForOtherProductsFormVisible();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] Failed to navigate to Other Products tab — ` +
          `the tab may not be visible or the form did not render. Original: ${err.message}`,
      );
    }

    // Select quote type from dropdown
    try {
      await manualQuoteSearchPage.openOtherQuoteTypeDropdown();
      await manualQuoteSearchPage.selectVisibleDropdownOption(quoteType);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] Failed to select quote type "${quoteType}" — ` +
          `the dropdown may not have opened or the option "${quoteType}" was not found in the list. ` +
          `Original: ${err.message}`,
      );
    }

    // Select start date (2 months ahead for stability)
    try {
      await manualQuoteSearchPage.clickOtherStartDateInput();
      await selectDateAfterAdvancingMonths(page, { monthsToAdvance: 2, dayIndex: startDateIndex });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] Failed to select start date — ` +
          `the date picker may not have opened or day index ${startDateIndex} was not available. ` +
          `Original: ${err.message}`,
      );
    }

    // Select end date (2 months ahead, a few days after start)
    try {
      await manualQuoteSearchPage.clickOtherEndDateInput();
      await selectDateAfterAdvancingMonths(page, { monthsToAdvance: 2, dayIndex: endDateIndex });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] Failed to select end date — ` +
          `the date picker may not have opened or day index ${endDateIndex} was not available. ` +
          `Original: ${err.message}`,
      );
    }

    // Fill comment if provided
    if (comment) {
      try {
        await manualQuoteSearchPage.typeOtherComment(comment);
      } catch (err) {
        throw new Error(
          `[ManualQuoteSearch.addOtherProductManualQuote] Failed to fill comment "${comment}" — ` +
            `the textarea may not be visible. Original: ${err.message}`,
        );
      }
    }

    // Fill base fare
    try {
      await manualQuoteSearchPage.typeOtherBaseFare(baseFare);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] Failed to fill base fare "${baseFare}" — ` +
          `the price section input may not be visible. Original: ${err.message}`,
      );
    }

    // Click Add Quote button
    try {
      await manualQuoteSearchPage.clickAddQuoteButton();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addOtherProductManualQuote] Failed to click "Add Quote" button — ` +
          `the button may be disabled (form validation failed?) or not visible. Original: ${err.message}`,
      );
    }

    return { added: true, quoteType, comment, baseFare };
  },

  async addGroundTransportManualQuote(page, {
    pickup,
    dropoff,
    monthsToAdvance = 1,
    dayIndex = 0,
    hour = "10:00",
    vehicleType = "All Types",
    vendor,
    vendorPhone,
    cancellationPolicy,
    confirmationNumber,
    baseFare = 0,
    tax = 0,
  } = {}) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.addGroundTransportManualQuote] "page" is required.');
    }
    if (!pickup || typeof pickup !== "string") {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] "pickup" must be a non-empty string, got: ${typeof pickup} (${JSON.stringify(pickup)})`,
      );
    }
    if (!dropoff || typeof dropoff !== "string") {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] "dropoff" must be a non-empty string, got: ${typeof dropoff} (${JSON.stringify(dropoff)})`,
      );
    }
    if (!vendor || typeof vendor !== "string") {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] "vendor" must be a non-empty string, got: ${typeof vendor} (${JSON.stringify(vendor)})`,
      );
    }
    if (!vendorPhone || typeof vendorPhone !== "string") {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] "vendorPhone" must be a non-empty string of digits, got: ${typeof vendorPhone} (${JSON.stringify(vendorPhone)})`,
      );
    }
    if (!cancellationPolicy || typeof cancellationPolicy !== "string") {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] "cancellationPolicy" must be a non-empty string, got: ${typeof cancellationPolicy} (${JSON.stringify(cancellationPolicy)})`,
      );
    }
    if (!confirmationNumber || typeof confirmationNumber !== "string") {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] "confirmationNumber" must be a non-empty string, got: ${typeof confirmationNumber} (${JSON.stringify(confirmationNumber)})`,
      );
    }

    logger.info("Adding Ground Transport manual quote", { pickup, dropoff, vendor, baseFare, tax });

    const searchPage = getPageObject(page, ManualQuoteSearchPage);

    // Navigate to Manual Quote tab → Ground Transport sub-tab
    try {
      await searchPage.clickManualQuoteTab();
      await searchPage.waitForManualQuotePageVisible();
      await searchPage.clickGroundTransportTab();
      await searchPage.waitForGroundTransportFormVisible();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to navigate to Ground Transport tab — ` +
          `the tab may not be visible or the form didn't load. Original: ${err.message}`,
      );
    }

    // Fill pickup address
    try {
      await searchPage.fillGroundPickup(pickup);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill pickup address "${pickup}" — ` +
          `Google Places autocomplete may not have returned results. Original: ${err.message}`,
      );
    }

    // Fill dropoff address
    try {
      await searchPage.fillGroundDropoff(dropoff);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill dropoff address "${dropoff}" — ` +
          `Google Places autocomplete may not have returned results. Original: ${err.message}`,
      );
    }

    // Select date
    try {
      await searchPage.clickGroundDateInput();
      await selectDateAfterAdvancingMonths(page, { monthsToAdvance, dayIndex });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to select date (months+${monthsToAdvance}, day index ${dayIndex}) — ` +
          `the calendar may not have opened or the day was unavailable. Original: ${err.message}`,
      );
    }

    // Fill hour
    try {
      await searchPage.fillGroundHour(hour);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill hour "${hour}" — ` +
          `the timepicker input may not be visible. Original: ${err.message}`,
      );
    }

    // Select vehicle type
    try {
      await searchPage.selectGroundVehicleType(vehicleType);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to select vehicle type "${vehicleType}" — ` +
          `the dropdown option may not exist. Original: ${err.message}`,
      );
    }

    // Select vendor
    try {
      await searchPage.selectGroundVendor(vendor);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to select vendor "${vendor}" — ` +
          `the dropdown option may not exist in the vendor list. Original: ${err.message}`,
      );
    }

    // Fill vendor phone
    try {
      await searchPage.fillGroundVendorPhone(vendorPhone);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill vendor phone "${vendorPhone}" — ` +
          `the phone inputs may not be visible. Original: ${err.message}`,
      );
    }

    // Fill cancellation policy
    try {
      await searchPage.fillGroundCancellationPolicy(cancellationPolicy);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill cancellation policy — ` +
          `the input may not be visible. Original: ${err.message}`,
      );
    }

    // Fill confirmation number
    try {
      await searchPage.fillGroundConfirmationNumber(confirmationNumber);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill confirmation number "${confirmationNumber}" — ` +
          `the input may not be visible. Original: ${err.message}`,
      );
    }

    // Fill base fare
    try {
      await searchPage.fillGroundBaseFare(baseFare);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill base fare "${baseFare}" — ` +
          `the price section may not be visible. Original: ${err.message}`,
      );
    }

    // Fill tax
    if (tax > 0) {
      try {
        await searchPage.fillGroundTax(tax);
      } catch (err) {
        throw new Error(
          `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to fill tax "${tax}" — ` +
            `the tax input may not be visible. Original: ${err.message}`,
        );
      }
    }

    // Click Add Quote
    try {
      await searchPage.clickAddQuoteButton();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addGroundTransportManualQuote] Failed to click "Add Quote" button — ` +
          `the button may be disabled (form validation failed?) or not visible. Original: ${err.message}`,
      );
    }

    return { added: true, pickup, dropoff, vendor, baseFare, tax };
  },

  // ===== CAR MANUAL QUOTE =====

  async addCarManualQuote(page, {
    pickupCity,
    dropoffCity,
    pickupAirport = "PDX",
    dropoffAirport = "SFO",
    carClass = "Mini Elite",
    vendor = "Avis",
    cancellationPolicy = "No limitation",
    confirmationNumber = "966231A",
    baseFare = 60,
    tax = 10,
    pickupDateIndex = 2,
    dropoffDateIndex = 5,
  } = {}) {
    if (!page) {
      throw new Error('[ManualQuoteSearch.addCarManualQuote] "page" is required.');
    }
    if (typeof pickupCity !== "string" || !pickupCity.trim()) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] "pickupCity" must be a non-empty string, got: ${typeof pickupCity} (${JSON.stringify(pickupCity)})`,
      );
    }
    if (typeof dropoffCity !== "string" || !dropoffCity.trim()) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] "dropoffCity" must be a non-empty string, got: ${typeof dropoffCity} (${JSON.stringify(dropoffCity)})`,
      );
    }

    logger.info("[ManualQuoteSearch.addCarManualQuote] Adding car manual quote", {
      pickupCity, dropoffCity, pickupAirport, dropoffAirport, carClass, vendor,
    });

    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);

    // Navigate to manual quote → Car tab
    try {
      await manualQuoteSearchPage.clickManualQuoteTab();
      await manualQuoteSearchPage.clickCarTab();
      await manualQuoteSearchPage.waitForCarFormVisible();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to navigate to Car tab — ` +
          `the tab may not be visible or the form did not render. Original: ${err.message}`,
      );
    }

    // Fill pickup location (airport code)
    try {
      await manualQuoteSearchPage.fillCarPickupLocation(pickupAirport);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill pickup location "${pickupAirport}" — ` +
          `the car-autocomplete dropdown may not have returned results for this airport code. ` +
          `Original: ${err.message}`,
      );
    }

    // Fill pickup city
    try {
      await manualQuoteSearchPage.fillCarPickupCity(pickupCity);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill pickup city "${pickupCity}" — ` +
          `the city autocomplete may not have returned results. Original: ${err.message}`,
      );
    }

    // Fill dropoff location (airport code)
    try {
      await manualQuoteSearchPage.fillCarDropoffLocation(dropoffAirport);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill dropoff location "${dropoffAirport}" — ` +
          `the car-autocomplete dropdown may not have returned results for this airport code. ` +
          `Original: ${err.message}`,
      );
    }

    // Fill dropoff city
    try {
      await manualQuoteSearchPage.fillCarDropoffCity(dropoffCity);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill dropoff city "${dropoffCity}" — ` +
          `the city autocomplete may not have returned results. Original: ${err.message}`,
      );
    }

    // Select pickup date — only if the field is empty (app may auto-fill from trip dates)
    const pickupDateValue = await page.locator(".manual-quote-car input[name=\"date-pick-up\"]").first().inputValue();
    if (!pickupDateValue) {
      try {
        await manualQuoteSearchPage.clickCarPickupDateInput();
        await selectDateAfterAdvancingMonths(page, { monthsToAdvance: 1, dayIndex: pickupDateIndex });
      } catch (err) {
        throw new Error(
          `[ManualQuoteSearch.addCarManualQuote] Failed to select pickup date — ` +
            `the date picker may not have opened or day index ${pickupDateIndex} was not available. ` +
            `Original: ${err.message}`,
        );
      }
    } else {
      logger.debug("[ManualQuoteSearch.addCarManualQuote] Pickup date already filled, skipping", { pickupDateValue });
    }

    // Set pickup time — required field. Selecting an explicit hour:minute works in
    // both 24h and 12h modes; leaving it empty silently blocks "Add Quote".
    try {
      await manualQuoteSearchPage.setCarPickupTime();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to set pickup time — ` +
          `the required time field could not be filled. Original: ${err.message}`,
      );
    }

    // Select dropoff date — only if the field is empty (app may auto-fill from trip dates)
    const dropoffDateInput = page.locator(".manual-quote-car .app-columns:nth-of-type(2) .app-datepicker input").first();
    const dropoffDateValue = await dropoffDateInput.inputValue();
    if (!dropoffDateValue) {
      try {
        await manualQuoteSearchPage.clickCarDropoffDateInput();
        await selectDateAfterAdvancingMonths(page, { monthsToAdvance: 1, dayIndex: dropoffDateIndex });
      } catch (err) {
        throw new Error(
          `[ManualQuoteSearch.addCarManualQuote] Failed to select dropoff date — ` +
            `the date picker may not have opened or day index ${dropoffDateIndex} was not available. ` +
            `Original: ${err.message}`,
        );
      }
    } else {
      logger.debug("[ManualQuoteSearch.addCarManualQuote] Dropoff date already filled, skipping", { dropoffDateValue });
    }

    // Set dropoff time — required field (see pickup time note above).
    try {
      await manualQuoteSearchPage.setCarDropoffTime();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to set dropoff time — ` +
          `the required time field could not be filled. Original: ${err.message}`,
      );
    }

    // Select car class
    try {
      await manualQuoteSearchPage.selectCarClass(carClass);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to select car class "${carClass}" — ` +
          `the dropdown may not have opened or the option was not found. Original: ${err.message}`,
      );
    }

    // Select vendor
    try {
      await manualQuoteSearchPage.selectCarVendor(vendor);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to select vendor "${vendor}" — ` +
          `the vendor dropdown may not have opened or the option was not found. Original: ${err.message}`,
      );
    }

    // Fill cancellation policy
    try {
      await manualQuoteSearchPage.fillCarCancellationPolicy(cancellationPolicy);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill cancellation policy "${cancellationPolicy}". ` +
          `Original: ${err.message}`,
      );
    }

    // Fill confirmation number
    try {
      await manualQuoteSearchPage.fillCarConfirmationNumber(confirmationNumber);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill confirmation number "${confirmationNumber}". ` +
          `Original: ${err.message}`,
      );
    }

    // Fill base fare
    try {
      await manualQuoteSearchPage.fillCarBaseFare(baseFare);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill base fare "${baseFare}" — ` +
          `the price section input may not be visible. Original: ${err.message}`,
      );
    }

    // Fill tax
    try {
      await manualQuoteSearchPage.fillCarTax(tax);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to fill tax "${tax}" — ` +
          `the price section tax input may not be visible. Original: ${err.message}`,
      );
    }

    // Click Add Quote
    try {
      await manualQuoteSearchPage.clickAddQuoteButton();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearch.addCarManualQuote] Failed to click "Add Quote" button — ` +
          `the button may be disabled (form validation failed?) or not visible. Check that all required fields ` +
          `(location, city, dates, class, vendor, cancellation, confirmation) are properly filled. ` +
          `Original: ${err.message}`,
      );
    }

    return { added: true, pickupCity, dropoffCity, pickupAirport, dropoffAirport, carClass, vendor, baseFare, tax };
  },
};

module.exports = ManualQuoteSearch;
