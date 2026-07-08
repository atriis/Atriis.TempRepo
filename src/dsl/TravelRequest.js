/**
 * TravelRequest DSL
 *
 * High-level business actions for travel request flows.
 *
 * Exposes business-level methods for sending a flight travel request.
 */
const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { SearchPage } = require("@pages/SearchPage");
const FlightSearchPage = require("@pages/FlightSearchPage");
const { TravelRequestPage } = require("@pages/TravelRequestPage");
const { CommonPage } = require("@pages/CommonPage");
const logger = require("@utils/logger").child("TravelRequest");

const TravelRequest = {
  /**
   * Fills and sends a flight travel request.
   * - Clicks the "Travel request" button on the search page
   * - Fills from/to fields and selects departure + return dates
   * - Clicks the "Send Request" button
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} from - Origin airport code (e.g. 'LON')
   * @param {string} to - Destination airport code (e.g. 'MAD')
   */
  async sendFlightTravelRequest(page, from, to) {
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string, got: ' + typeof from);
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string, got: ' + typeof to);

    const searchPage = getPageObject(page, SearchPage);
    const travelRequestPage = getPageObject(page, TravelRequestPage);

    // Navigate to the Travel Request page
    await searchPage.clickTravelRequestButton();

    // Click "Flight" to render the flight-search-inputs form
    await travelRequestPage.clickFlightButton();
    await travelRequestPage.waitForFlightSearchInputs();

    // Fill origin and destination — same airport-autocomplete selectors as main search
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Open date picker — scroll into view + wait for panel to stabilize
    await travelRequestPage.clickDepartureDateField();
    // Select dates from the currently visible months — no navigation needed
    await selectDatesByNthAvailable(page, {
      startIndex: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      endIndex: SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    });

    await travelRequestPage.clickSendRequestButton();

    // Trip Reference Form modal appears before the success screen — save it to proceed
    const commonPage = getPageObject(page, CommonPage);
    const saveBtn = commonPage.getSaveButton();
    try {
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click();
    } catch {
      // No reference form appeared — continue
    }
  },

  /**
   * Opens the advanced round-trip flight search inside the request assistance form.
   * - Clicks the "Flight" service button to render the flight-search-inputs form
   * - Ensures the trip type is "Round trip" (separate outbound/return legs)
   * - Expands the advanced-search options panel (reveals per-leg date-type/time/cabin fields
   *   and the preferred-airline selector)
   * - Enables the "Via" checkbox so a connection (stopover) airport can be entered
   *
   * The flight form here is the same component the main search uses, so the advanced-search
   * page methods apply unchanged.
   *
   * @param {import('@playwright/test').Page} page
   */
  async openAdvancedFlightSearch(page) {
    if (!page) throw new Error('[TravelRequest.openAdvancedFlightSearch] "page" is required.');

    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const searchPage = getPageObject(page, SearchPage);
    const flightSearchPage = getPageObject(page, FlightSearchPage);

    try {
      await travelRequestPage.clickFlightButton();
      await travelRequestPage.waitForFlightSearchInputs();
      // The flight form initializes asynchronously (loads carriers, re-renders). That late
      // re-render resets the advanced toggle back to collapsed, so let it settle BEFORE opening
      // advanced — otherwise the panel opens and then silently closes a moment later.
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await searchPage.selectRoundTrip();
      await page.waitForTimeout(800);

      // Open advanced (splits into departure + return sections and reveals the Via checkbox +
      // preferred-airline selector). The toggle can still be reset by a late re-render, so click
      // and confirm the panel STAYS open; retry if it collapsed.
      let advancedOpen = false;
      for (let attempt = 0; attempt < 3 && !advancedOpen; attempt++) {
        await flightSearchPage.clickAdvancedSearchButton();
        await page.waitForTimeout(800);
        advancedOpen = await flightSearchPage.isAdvancedSearchExpanded();
      }
      if (!advancedOpen) {
        throw new Error('the advanced-search panel did not stay expanded after 3 attempts (a late form re-render keeps resetting it)');
      }

      // Enable Via, then confirm the connection field actually rendered — this proves Via is on
      // AND advanced stayed open.
      await flightSearchPage.enableViaConnection();
      await searchPage.waitForViaConnectionField();
    } catch (err) {
      throw new Error(
        '[TravelRequest.openAdvancedFlightSearch] Could not open the advanced round-trip flight ' +
        'search in the request assistance form. The "Flight" service button may not have rendered the ' +
        'flight-search-inputs form, the Round trip trip type was unavailable, the advanced-search panel ' +
        `did not expand, or the Via checkbox was missing. Original: ${err.message}`
      );
    }

    return { opened: true };
  },

  /**
   * Fills and sends an advanced round-trip flight travel request (with a Via stopover) so the
   * agent can view the detailed criteria. Every value comes from the caller — nothing about the
   * route is hard-coded here.
   * - Fills origin, destination, and the Via connection airport
   * - Selects outbound and return departure dates
   * - Sets each leg's date-type, time frame, and cabin class (outbound + return)
   * - Selects the preferred airline (carrier) in the already-open advanced-options panel
   * - Clicks "Send request" (the Trip Reference Form popup, if any, is left for the caller to
   *   dismiss via saveReferenceFieldIfPresent — this method does not dismiss it)
   *
   * Requires the advanced round-trip form to already be open (see openAdvancedFlightSearch).
   *
   * @param {import('@playwright/test').Page} page
   * @param {Object} request
   * @param {string} request.from - Origin city/airport, e.g. "London"
   * @param {string} request.to - Destination city/airport, e.g. "Tel Aviv"
   * @param {string} request.via - Connection (stopover) city/airport, e.g. "Rome"
   * @param {string} request.preferredAirline - Preferred carrier label, e.g. "British Airways"
   * @param {{dateType: string, time: string, cabin: string}} request.outbound - Outbound leg criteria
   * @param {{dateType: string, time: string, cabin: string}} request.inbound - Return leg criteria
   */
  async sendAdvancedFlightSearchTravelRequest(page, request) {
    if (!page) throw new Error('[TravelRequest.sendAdvancedFlightSearchTravelRequest] "page" is required.');
    if (!request || typeof request !== 'object') {
      throw new Error(
        '[TravelRequest.sendAdvancedFlightSearchTravelRequest] "request" must be an object, got: ' + typeof request
      );
    }
    const { from, to, via, preferredAirline, outbound, inbound } = request;
    [['from', from], ['to', to], ['via', via], ['preferredAirline', preferredAirline]].forEach(([name, val]) => {
      if (!val || typeof val !== 'string') {
        throw new Error(
          `[TravelRequest.sendAdvancedFlightSearchTravelRequest] "${name}" must be a non-empty string, got: ${typeof val}`
        );
      }
    });
    [['outbound', outbound], ['inbound', inbound]].forEach(([name, leg]) => {
      if (!leg || typeof leg !== 'object') {
        throw new Error(
          `[TravelRequest.sendAdvancedFlightSearchTravelRequest] "${name}" must be a {dateType, time, cabin} object, got: ${typeof leg}`
        );
      }
      ['dateType', 'time', 'cabin'].forEach((field) => {
        if (!leg[field] || typeof leg[field] !== 'string') {
          throw new Error(
            `[TravelRequest.sendAdvancedFlightSearchTravelRequest] "${name}.${field}" must be a non-empty string, got: ${typeof leg[field]}`
          );
        }
      });
    });

    logger.debug('Sending advanced round-trip flight travel request', { from, to, via, preferredAirline, outbound, inbound });

    const searchPage = getPageObject(page, SearchPage);
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const travelRequestPage = getPageObject(page, TravelRequestPage);

    try {
      // Route: origin (departure section), destination (return section), and the Via connection.
      await searchPage.fillInFromField(from);
      await searchPage.fillInToField(to);
      await searchPage.fillViaConnection(via);
      // Autocomplete popper must fully close before clicking date fields (no dismiss event exists).
      await page.waitForTimeout(1000);

      // Outbound + return departure dates (advanced round trip uses separate date fields).
      await searchPage.clickDepartureDateField();
      await searchPage.clickCalendarNextArrow();
      await selectDatesByNthAvailable(page, { startIndex: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX, endIndex: null });
      await searchPage.waitForDatePickerToClose();
      await flightSearchPage.clickAdvancedReturnDateField();
      await selectDatesByNthAvailable(page, { startIndex: SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX, endIndex: null });
      await searchPage.waitForDatePickerToClose();

      // Outbound leg criteria: date-type, time frame, cabin. Wait for each dropdown to close
      // before opening the next — the leg selects share the El-Plus dropdown DOM node.
      await flightSearchPage.selectDepartureDateType(outbound.dateType);
      await flightSearchPage.waitForSelectDropdownToClose();
      await flightSearchPage.selectDepartureFlightTime(outbound.time);
      await flightSearchPage.waitForSelectDropdownToClose();
      await flightSearchPage.selectDepartureFlightClass(outbound.cabin);
      await flightSearchPage.waitForSelectDropdownToClose();

      // Return leg criteria.
      await flightSearchPage.selectReturnDateType(inbound.dateType);
      await flightSearchPage.waitForSelectDropdownToClose();
      await flightSearchPage.selectReturnFlightTime(inbound.time);
      await flightSearchPage.waitForSelectDropdownToClose();
      await flightSearchPage.selectReturnFlightClass(inbound.cabin);
      await flightSearchPage.waitForSelectDropdownToClose();

      // Preferred airline lives in the already-open advanced-options panel.
      await flightSearchPage.selectPreferredCarrier(preferredAirline);

      // Submit — clickSendRequestButton confirms the submit registered and leaves any
      // Trip Reference Form popup open for saveReferenceFieldIfPresent to handle.
      await travelRequestPage.clickSendRequestButton();
    } catch (err) {
      throw new Error(
        '[TravelRequest.sendAdvancedFlightSearchTravelRequest] Could not send the advanced round-trip ' +
        `flight travel request from "${from}" to "${to}" via "${via}" with preferred airline ` +
        `"${preferredAirline}". A route field, date, date-type/time/cabin selection, or the ` +
        `preferred-airline option may not have been available. Original: ${err.message}`
      );
    }

    return { sent: true, from, to, via, preferredAirline, outbound, inbound };
  },

  /**
   * Saves the Trip Reference Form popup if it is displayed, otherwise continues.
   * Travellers with mandatory reference questions see this modal after "Send request";
   * others go straight to the "Sent to agent" confirmation. The Save button is optional,
   * so its absence within the short wait is not an error.
   *
   * @param {import('@playwright/test').Page} page
   */
  async saveReferenceFieldIfPresent(page) {
    if (!page) throw new Error('[TravelRequest.saveReferenceFieldIfPresent] "page" is required.');

    // The Trip Reference Form popup is optional — clickSaveButtonIfVisible saves it if present
    // and no-ops otherwise (mirrors the existing CommonPage.clickProceedButtonIfVisible pattern).
    const commonPage = getPageObject(page, CommonPage);
    const saved = await commonPage.clickSaveButtonIfVisible();
    return { saved };
  },

  /**
   * Waits for the "Sent to agent" confirmation message to appear.
   * Resilient to two-path flow:
   *  - Path A: booking-success page shows "Sent to agent" text
   *  - Path B: Trip Reference Form Save navigated directly to trip overview (shows Requests tab)
   * Uses DOM element checks (not URL) to avoid false positives on intermediate /trips/ URLs.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifySentToAgent(page) {
    // Wait for either the "Sent to agent" text OR the Requests tab (reference form bypass path)
    await page.waitForFunction(
      () =>
        document.body.innerText.includes('Sent to agent') ||
        Array.from(document.querySelectorAll('[role="tab"]')).some((t) => t.textContent.trim() === 'Requests'),
      null,
      { timeout: 30000 }
    );
  },

  /**
   * Navigates from the travel request booking-success screen to the trip view.
   * Handles two paths using DOM element detection (not URL):
   *  - Path A: "Go to trip" button is visible → click it → wait for Requests tab
   *  - Path B: Already on trip overview (reference form path) → Requests tab already visible
   * Then clicks the Requests tab in both cases.
   *
   * @param {import('@playwright/test').Page} page
   */
  async navigateToTravelRequestTrip(page) {
    const goToTripBtn = page.getByRole('button', { name: 'Go to trip' }).first();
    const requestsTab = page.getByRole('tab', { name: 'Requests' });
    // Check which path we're on by looking for the "Go to trip" button
    const goToTripVisible = await goToTripBtn.isVisible().catch(() => false);
    if (goToTripVisible) {
      // Path A: on booking-success page — click "Go to trip"
      await goToTripBtn.click();
    }
    // Both paths: wait for Requests tab to appear (trip overview loaded), then click it
    await requestsTab.waitFor({ state: 'visible', timeout: 25000 });
    await requestsTab.click();
  },

  /**
   * Verifies that the travel requested items section is visible in the trip view.
   * Asserts the "Travel request items" heading is present on the Requests tab.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyRequestedItemsVisible(page) {
    await page.getByText('Travel request items').waitFor({ state: 'visible', timeout: 30000 });
  },

  /**
   * Verifies that a travel requested item card is visible in the trip with a title
   * containing the given text (e.g. "Requested"). Reads the requested-item card title
   * from the travel request page (general-product-card.vue) and asserts it is visible.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} text - Text the requested item title must contain (e.g. "Requested")
   */
  async verifyRequestedItemTitleContains(page, text) {
    if (!page) throw new Error('page is required');
    if (!text || typeof text !== 'string') {
      throw new Error('text must be a non-empty string, got: ' + typeof text);
    }

    const travelRequestPage = getPageObject(page, TravelRequestPage);
    try {
      const titleLocator = travelRequestPage.getRequestedItemCardTitle(text).first();
      await expect(
        titleLocator,
        `[TravelRequest.verifyRequestedItemTitleContains] Expected a travel requested item card title containing "${text}" to be visible in the trip.`
      ).toBeVisible({ timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[TravelRequest.verifyRequestedItemTitleContains] Could not confirm a travel requested item title containing "${text}" in the trip. ` +
        `The Requests tab may not have loaded, or the requested item was not created for the agent. Original: ${err.message}`
      );
    }
  },

  /**
   * Navigates to the trip cart page by extracting the trip ID from the current URL
   * and navigating to /trips/{tripId}/cart.
   *
   * @param {import('@playwright/test').Page} page
   */
  async navigateToTripCart(page) {
    if (!page) throw new Error('page is required');
    const currentUrl = new URL(page.url());
    const tripIdMatch = currentUrl.pathname.match(/\/trips\/(\d+)/);
    if (!tripIdMatch) throw new Error('navigateToTripCart: could not find trip ID in URL: ' + currentUrl.href);
    currentUrl.pathname = `/trips/${tripIdMatch[1]}/cart`;
    await page.goto(currentUrl.href, { waitUntil: 'domcontentloaded' });
  },

};

module.exports = TravelRequest;
