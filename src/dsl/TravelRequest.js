/**
 * TravelRequest DSL
 *
 * High-level business actions for travel request flows.
 *
 * Exposes business-level methods for sending a flight travel request.
 */
const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { selectDatesByNthAvailable, clickNextVisibleMonth } = require("@utils/calendar.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { SearchPage } = require("@pages/SearchPage");
const FlightSearchPage = require("@pages/FlightSearchPage");
const { TravelRequestPage } = require("@pages/TravelRequestPage");
const DynamicAndReferenceFieldsPage = require("@pages/DynamicAndReferenceFieldsPage");
const { CommonPage } = require("@pages/CommonPage");
const { normalizeText } = require("@utils/text");
const logger = require("@utils/logger").child("TravelRequest");

/**
 * Makes sure the request-assistance form holds exactly ONE flight item, and returns once that
 * item's form is visible.
 *
 * The RA view seeds an item for the active product — flight, when the form was opened from the
 * flight tab — about 300ms after created(), guarded by `if (!requestAssistanceItems.length)`
 * (request-assistance.ts). Clicking "Flight" before that timer fires is absorbed by the guard, but
 * clicking after it adds a SECOND flight item: two flight legs in the request the agent receives,
 * and a strict-mode violation on `.flight-search-inputs`. Which side of the race a run lands on is
 * pure timing, so wait for the seeding pass to finish and only add a flight item if none arrived.
 *
 * @param {import('@playwright/test').Page} page
 */
async function ensureFlightItem(page) {
  const travelRequestPage = getPageObject(page, TravelRequestPage);

  // Any rendered item means the seeding pass already ran. If none appears, fall through and add the
  // flight item here — the form is then empty, so there is nothing to duplicate.
  await travelRequestPage.waitForFirstRequestItem();

  if ((await travelRequestPage.getFlightItemCount()) === 0) {
    await travelRequestPage.clickFlightButton();
  }
  await travelRequestPage.waitForFlightSearchInputs();

  const flightItems = await travelRequestPage.getFlightItemCount();
  if (flightItems > 1) {
    throw new Error(
      `the request-assistance form holds ${flightItems} flight items instead of one, so the leg ` +
      `filled here would not be the one reviewed and sent (a stale flight item left in the store by ` +
      `an earlier request-assistance visit is the likely cause)`
    );
  }
}

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

    // Make sure exactly one flight item is rendered (the form seeds one itself when opened from
    // the flight tab — clicking "Flight" unconditionally would duplicate it)
    await ensureFlightItem(page);

    // Fill origin and destination — same airport-autocomplete selectors as main search
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Depart + return — one range picker; open it through the RA-scoped picker so the exact
    // "Depart Date" input is clicked and only the VISIBLE panel is awaited. A `placeholder*='Depart'`
    // match also hits the origin autocomplete ("From... Departure"), which sits FIRST in the DOM, and
    // the search page beneath keeps a hidden stale range-picker the unscoped wait latched onto.
    await travelRequestPage.openFlightDepartDatePicker();
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
   * Fills the flight leg of the request-assistance form WITHOUT sending it — the fill-only
   * counterpart of sendFlightTravelRequest, for scenarios that add more products (car, hotel)
   * to the request before clicking "Send request".
   * Requires the request-assistance form to already be open (e.g. via the request assistance icon).
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} from - Origin airport query, e.g. "lhr"
   * @param {string} to - Destination airport query, e.g. "MAD"
   */
  async fillRequestAssistanceFlight(page, from, to) {
    if (!page) throw new Error('[TravelRequest.fillRequestAssistanceFlight] "page" is required.');
    if (!from || typeof from !== 'string') {
      throw new Error(`[TravelRequest.fillRequestAssistanceFlight] "from" must be a non-empty string, got: ${typeof from}`);
    }
    if (!to || typeof to !== 'string') {
      throw new Error(`[TravelRequest.fillRequestAssistanceFlight] "to" must be a non-empty string, got: ${typeof to}`);
    }
    logger.debug('Filling request-assistance flight leg (no send)', { from, to });

    const searchPage = getPageObject(page, SearchPage);
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    try {
      // Render the flight-search-inputs form inside the request item — reusing the item the form
      // seeds on its own rather than adding a duplicate one.
      await ensureFlightItem(page);

      // Origin and destination — same airport-autocomplete selectors as the main search.
      await searchPage.fillInFromField(from);
      await searchPage.fillInToField(to);

      // Depart + return — one range picker; select from the visible months. Opened via the
      // RA-scoped picker (not clickDepartureDateField): the search page beneath keeps a hidden
      // stale range-picker in the DOM that the unscoped panel wait would latch onto.
      await travelRequestPage.openFlightDepartDatePicker();
      await selectDatesByNthAvailable(page, {
        startIndex: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
        endIndex: SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
      });
    } catch (err) {
      throw new Error(
        `[TravelRequest.fillRequestAssistanceFlight] Could not fill the request-assistance flight leg ` +
        `from "${from}" to "${to}". The flight form may not have rendered, an airport autocomplete may ` +
        `have returned no results, or the date picker did not open. Original: ${err.message}`
      );
    }
    return { filled: true, from, to };
  },

  /**
   * Opens the advanced round-trip flight search inside the request assistance form.
   * - Ensures the form holds exactly one flight item, whose flight-search-inputs form is rendered
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

    const searchPage = getPageObject(page, SearchPage);
    const flightSearchPage = getPageObject(page, FlightSearchPage);

    try {
      await ensureFlightItem(page);
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
        'search in the request assistance form. The flight-search-inputs form may not have rendered, ' +
        'the Round trip trip type was unavailable, the advanced-search panel ' +
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
   * Verifies the success-screen description (the subtitle under "Sent to agent") shows the
   * expected text, e.g. "Your request was successfully created".
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} expectedText
   */
  async verifySuccessDescription(page, expectedText) {
    if (!page) throw new Error('[TravelRequest.verifySuccessDescription] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[TravelRequest.verifySuccessDescription] "expectedText" must be a non-empty string, got: ${typeof expectedText}`
      );
    }
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const description = travelRequestPage.getSuccessDescription();
    try {
      await description.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[TravelRequest.verifySuccessDescription] The travel-request success description did not appear. ` +
        `The request may not have been submitted successfully. Original: ${err.message}`
      );
    }
    const actual = (await description.innerText()).trim();
    expect(
      actual,
      `[TravelRequest.verifySuccessDescription] Expected the success description to be "${expectedText}" but it was "${actual}".`
    ).toBe(expectedText);
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

  // ===== Request-assistance review-form actions =====

  /**
   * Captures the departure and return dates entered in the flight SEARCH form (before opening the
   * request-assistance review). These are the ground-truth values the later request-assistance
   * verifies compare against: the flight depart/return dates and the parallel hotel check-in/check-out
   * all mirror these same two dates. Reuses SearchPage's proven date-field getters.
   *
   * @param {import('@playwright/test').Page} page
   * @returns {Promise<{departureDate: string, returnDate: string}>}
   */
  async captureRoundTripDates(page) {
    if (!page) throw new Error('[TravelRequest.captureRoundTripDates] "page" is required.');
    const searchPage = getPageObject(page, SearchPage);

    const departureDate = await searchPage.getDepartureDateFieldValue();
    const returnDate = await searchPage.getReturnDateFieldValue();

    if (!departureDate) {
      throw new Error('[TravelRequest.captureRoundTripDates] The flight search departure date was empty — the round-trip dates must be entered before extracting them.');
    }
    if (!returnDate) {
      throw new Error('[TravelRequest.captureRoundTripDates] The flight search return date was empty — the round-trip dates must be entered before extracting them.');
    }

    logger.info('Captured round-trip dates for travel-request verification', { departureDate, returnDate });
    return { departureDate, returnDate };
  },

  /**
   * Verifies the request-assistance "Who are the travellers?" section title.
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Expected section-title text
   */
  async verifyTravelersSectionTitle(page, expected) {
    if (!page) throw new Error('[TravelRequest.verifyTravelersSectionTitle] "page" is required.');
    if (!expected || typeof expected !== 'string') {
      throw new Error(`[TravelRequest.verifyTravelersSectionTitle] "expected" must be a non-empty string, got: ${typeof expected}`);
    }
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const title = travelRequestPage.getTravelersSectionTitle().first();
    // Poll (matches the field-verify pattern) so a title that renders just after the form mounts is
    // retried rather than failing on a first read.
    await expect
      .poll(async () => normalizeText(await title.textContent().catch(() => "")), {
        timeout: 30000,
        message: `[TravelRequest.verifyTravelersSectionTitle] Expected the travellers section title to read "${expected}".`,
      })
      .toBe(normalizeText(expected));
  },

  /**
   * Verifies a product item (e.g. "Flight" / "Hotel") is shown in the request-assistance form.
   * @param {import('@playwright/test').Page} page
   * @param {string} product - Product label expected in the form
   */
  async verifyProductInRequestForm(page, product) {
    if (!page) throw new Error('[TravelRequest.verifyProductInRequestForm] "page" is required.');
    if (!product || typeof product !== 'string') {
      throw new Error(`[TravelRequest.verifyProductInRequestForm] "product" must be a non-empty string, got: ${typeof product}`);
    }
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    await expect(
      travelRequestPage.getProductTitle(product).first(),
      `[TravelRequest.verifyProductInRequestForm] Expected the "${product}" product to be shown in the request-assistance form.`
    ).toBeVisible({ timeout: 30000 });
  },

  /**
   * Verifies the flight origin shown in the request-assistance form.
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Expected origin value (e.g. "London, United Kingdom - All airports (LON)")
   */
  async verifyRequestFlightOrigin(page, expected) {
    await assertRequestFieldValue(page, expected, 'flightOrigin', 'flight origin');
  },

  /**
   * Verifies the flight destination shown in the request-assistance form.
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Expected destination value (e.g. "Madrid, Spain (MAD)")
   */
  async verifyRequestFlightDestination(page, expected) {
    await assertRequestFieldValue(page, expected, 'flightDestination', 'flight destination');
  },

  /**
   * Verifies the flight depart date shown in the request-assistance form matches the extracted date.
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Extracted departure date captured from the search form
   */
  async verifyRequestFlightDepartDate(page, expected) {
    await assertRequestFieldValue(page, expected, 'flightDepartDate', 'flight depart date');
  },

  /**
   * Verifies the flight return date shown in the request-assistance form matches the extracted date.
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Extracted return date captured from the search form
   */
  async verifyRequestFlightReturnDate(page, expected) {
    await assertRequestFieldValue(page, expected, 'flightReturnDate', 'flight return date');
  },

  /**
   * Verifies the flight origin shown in the request-assistance form CONTAINS the expected text.
   * The origin input carries the full airport label (e.g. "London, United Kingdom - All airports
   * (LON)"), so a contains-check on the city ("London") is robust to label formatting. Polls because
   * the value settles reactively after the form renders (see verifyRequestAssistanceHotelDestination).
   * @param {import('@playwright/test').Page} page
   * @param {string} expectedSubstring - Text the flight origin must contain (e.g. "London")
   */
  async verifyRequestFlightOriginContains(page, expectedSubstring) {
    await assertRequestFieldContains(page, expectedSubstring, 'flightOrigin', 'flight origin');
  },

  /**
   * Verifies the flight destination shown in the request-assistance form CONTAINS the expected text
   * (e.g. "Tel Aviv"). Same contains + poll rationale as verifyRequestFlightOriginContains.
   * @param {import('@playwright/test').Page} page
   * @param {string} expectedSubstring - Text the flight destination must contain (e.g. "Tel Aviv")
   */
  async verifyRequestFlightDestinationContains(page, expectedSubstring) {
    await assertRequestFieldContains(page, expectedSubstring, 'flightDestination', 'flight destination');
  },

  /**
   * Verifies the cabin class shown in the request-assistance flight item (e.g. "Premium Economy").
   * The cabin selector is an el-select whose selected label carries into the request form; polls so a
   * value still settling after render doesn't fail on the first read.
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Expected cabin class (e.g. "Premium Economy")
   */
  async verifyRequestFlightCabinClass(page, expected) {
    if (!page) throw new Error('[TravelRequest.verifyRequestFlightCabinClass] "page" is required.');
    if (!expected || typeof expected !== 'string') {
      throw new Error(`[TravelRequest.verifyRequestFlightCabinClass] "expected" must be a non-empty string, got: ${typeof expected}`);
    }
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    await expect
      .poll(async () => normalizeText(await travelRequestPage.getRequestFlightCabinClass()), {
        timeout: 30000,
        message: `[TravelRequest.verifyRequestFlightCabinClass] Expected the request-assistance flight cabin class to show "${expected}".`,
      })
      .toBe(normalizeText(expected));
  },

  /**
   * Verifies the number of (named) travellers shown in the request-assistance travellers section.
   * @param {import('@playwright/test').Page} page
   * @param {number} expectedCount - Expected number of travellers (e.g. 2)
   */
  async verifyTravelersCount(page, expectedCount) {
    if (!page) throw new Error('[TravelRequest.verifyTravelersCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(`[TravelRequest.verifyTravelersCount] "expectedCount" must be a non-negative integer, got: ${expectedCount}`);
    }
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    // Poll: the travellers list renders reactively, so tags can mount one after another — a single
    // read can catch it mid-render and undercount. Retry until the count settles at the expected value.
    await expect
      .poll(async () => {
        try {
          return await travelRequestPage.getTravelersCount({ timeout: 3000 });
        } catch {
          return 0;
        }
      }, {
        timeout: 30000,
        message: `[TravelRequest.verifyTravelersCount] Expected the request-assistance travellers section to show ${expectedCount} travellers.`,
      })
      .toBe(expectedCount);
  },

  /**
   * Verifies the hotel destination shown in the request-assistance form.
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Expected hotel destination value (e.g. "Madrid,Spain,(MAD)")
   */
  async verifyRequestHotelDestination(page, expected) {
    await assertRequestFieldValue(page, expected, 'hotelDestination', 'hotel destination');
  },

  /**
   * Verifies the hotel check-in date shown in the request-assistance form matches the extracted
   * flight departure date (the parallel hotel inherits the flight dates).
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Extracted flight departure date captured from the search form
   */
  async verifyRequestHotelCheckInDate(page, expected) {
    await assertRequestFieldValue(page, expected, 'hotelCheckIn', 'hotel check-in date');
  },

  /**
   * Verifies the hotel check-out date shown in the request-assistance form matches the extracted
   * flight return date (the parallel hotel inherits the flight dates).
   * @param {import('@playwright/test').Page} page
   * @param {string} expected - Extracted flight return date captured from the search form
   */
  async verifyRequestHotelCheckOutDate(page, expected) {
    await assertRequestFieldValue(page, expected, 'hotelCheckOut', 'hotel check-out date');
  },

  /**
   * Clicks the "Send request" button on the request-assistance form. The Trip Reference Form popup,
   * if any, is left for the caller to dismiss via saveReferenceFieldIfPresent.
   * @param {import('@playwright/test').Page} page
   */
  async clickSendRequest(page) {
    if (!page) throw new Error('[TravelRequest.clickSendRequest] "page" is required.');
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    await travelRequestPage.clickSendRequestButton();
  },

  // ===== Hotel request item =====

  /**
   * Verifies the request-assistance hotel destination CONTAINS the expected substring (the field is
   * pre-populated from the hotel search, e.g. "London, United Kingdom ..." contains "London").
   * Polls because the parallel hotel value settles reactively after the form renders.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} expectedSubstring - Text the hotel destination must contain (e.g. "London")
   */
  async verifyRequestAssistanceHotelDestination(page, expectedSubstring) {
    await assertRequestFieldContains(page, expectedSubstring, 'hotelDestination', 'hotel destination');
  },

  /**
   * Adds a comment to the request-assistance hotel item.
   * @param {import('@playwright/test').Page} page
   * @param {string} comment
   */
  async addHotelRequestComment(page, comment) {
    if (!page) throw new Error('[TravelRequest.addHotelRequestComment] "page" is required.');
    if (!comment || typeof comment !== 'string') {
      throw new Error(`[TravelRequest.addHotelRequestComment] "comment" must be a non-empty string, got: ${typeof comment}`);
    }
    logger.debug('Adding hotel request-assistance comment', { comment });
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    try {
      await travelRequestPage.fillItemComment('hotel', comment);
    } catch (err) {
      throw new Error(
        `[TravelRequest.addHotelRequestComment] Could not add the comment "${comment}" to the hotel request item. ` +
        `The hotel item's comment textarea may not have rendered. Original: ${err.message}`
      );
    }
  },

  // ===== Car request item (combined) =====

  /**
   * Adds a car item to the request assistance and fills it end to end: pick-up location (autocomplete),
   * pick-up and drop-off dates (next month), and optionally the item comment. Pick-up/drop-off times
   * are left at the form's valid defaults (10:00) and are not asserted downstream; the location (and
   * comment, when given) carry the meaningful test data.
   *
   * @param {import('@playwright/test').Page} page
   * @param {Object} request
   * @param {string} request.location - Pick-up location query, e.g. "madrid"
   * @param {string} [request.comment] - Optional comment for the car item, e.g. "carrr 3"
   */
  async addCarToRequestAssistance(page, request) {
    if (!page) throw new Error('[TravelRequest.addCarToRequestAssistance] "page" is required.');
    if (!request || typeof request !== 'object') {
      throw new Error(`[TravelRequest.addCarToRequestAssistance] "request" must be an object, got: ${typeof request}`);
    }
    const { location, comment } = request;
    if (!location || typeof location !== 'string') {
      throw new Error(`[TravelRequest.addCarToRequestAssistance] "location" must be a non-empty string, got: ${typeof location}`);
    }
    if (comment !== undefined && (!comment || typeof comment !== 'string')) {
      throw new Error(`[TravelRequest.addCarToRequestAssistance] "comment", when given, must be a non-empty string, got: ${typeof comment}`);
    }
    logger.debug('Adding car to request assistance', { location, comment });

    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const searchPage = getPageObject(page, SearchPage);
    try {
      await travelRequestPage.clickAddServiceButton('Car');
      await travelRequestPage.waitForProductSearchInputs('car');

      // Pick-up location via autocomplete (shared app-autocomplete-popper).
      await travelRequestPage.fillCarPickUpLocation(location);

      // Pick-up date — next month, first available day. Times stay at the form default (10:00).
      await travelRequestPage.openCarPickUpDatePicker();
      await clickNextVisibleMonth(page);
      await selectDatesByNthAvailable(page, { startIndex: 0 });
      await searchPage.waitForDatePickerToClose();

      // Drop-off date — next month, a few days after pick-up so it is valid.
      await travelRequestPage.openCarDropOffDatePicker();
      await clickNextVisibleMonth(page);
      await selectDatesByNthAvailable(page, { startIndex: 3 });
      await searchPage.waitForDatePickerToClose();

      // Comment (optional — some flows send the request without one).
      if (comment !== undefined) {
        await travelRequestPage.fillItemComment('car', comment);
      }
    } catch (err) {
      throw new Error(
        `[TravelRequest.addCarToRequestAssistance] Could not add the car request item for pick-up "${location}"` +
        `${comment !== undefined ? ` with comment "${comment}"` : ''}. A form field (location autocomplete, ` +
        `pick-up/drop-off date or time, or the comment) may not have been available. Original: ${err.message}`
      );
    }
    return { added: true, location, comment };
  },

  /**
   * Adds a hotel item to the request assistance and fills it: destination (autocomplete) and
   * check-in/check-out dates (next month). Dates are not asserted downstream; the destination
   * carries the meaningful test data.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} destination - Destination query, e.g. "lon"
   */
  async addHotelToRequestAssistance(page, destination) {
    if (!page) throw new Error('[TravelRequest.addHotelToRequestAssistance] "page" is required.');
    if (!destination || typeof destination !== 'string') {
      throw new Error(
        `[TravelRequest.addHotelToRequestAssistance] "destination" must be a non-empty string, got: ${typeof destination}`
      );
    }
    logger.debug('Adding hotel to request assistance', { destination });

    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const searchPage = getPageObject(page, SearchPage);
    try {
      await travelRequestPage.clickAddServiceButton('Hotel');
      await travelRequestPage.waitForProductSearchInputs('hotel');

      // Destination via the hotel autocomplete (hotel-autocomplete-popper).
      await travelRequestPage.fillHotelDestination(destination);

      // Check-in/check-out share one range picker — select both ends from the next month so the
      // stay is always in the future regardless of what the flight dates preselected.
      await travelRequestPage.openHotelCheckInDatePicker();
      await clickNextVisibleMonth(page);
      await selectDatesByNthAvailable(page, { startIndex: 0, endIndex: 3 });
      await searchPage.waitForDatePickerToClose();
    } catch (err) {
      throw new Error(
        `[TravelRequest.addHotelToRequestAssistance] Could not add the hotel request item for ` +
        `"${destination}". The destination autocomplete may have returned no results or the ` +
        `check-in/check-out picker did not open. Original: ${err.message}`
      );
    }
    return { added: true, destination };
  },

  // ===== Rail request item (combined) =====

  /**
   * Adds an EU rail journey to the request assistance and fills it end to end: origin and destination
   * stations (autocomplete), departure and return dates (next month), and the item comment. Dates are
   * not asserted downstream; the origin/destination and comment carry the meaningful test data.
   *
   * @param {import('@playwright/test').Page} page
   * @param {Object} request
   * @param {string} request.origin - Origin station query, e.g. "bruss"
   * @param {string} request.destination - Destination station query, e.g. "paris"
   * @param {string} request.comment - Comment for the rail item, e.g. "railll4"
   */
  async addRailToRequestAssistance(page, request) {
    if (!page) throw new Error('[TravelRequest.addRailToRequestAssistance] "page" is required.');
    if (!request || typeof request !== 'object') {
      throw new Error(`[TravelRequest.addRailToRequestAssistance] "request" must be an object, got: ${typeof request}`);
    }
    const { origin, destination, comment } = request;
    [['origin', origin], ['destination', destination], ['comment', comment]].forEach(([name, val]) => {
      if (!val || typeof val !== 'string') {
        throw new Error(`[TravelRequest.addRailToRequestAssistance] "${name}" must be a non-empty string, got: ${typeof val}`);
      }
    });
    logger.debug('Adding rail journey to request assistance', { origin, destination, comment });

    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const searchPage = getPageObject(page, SearchPage);
    try {
      await travelRequestPage.clickAddServiceButton('Rail');
      await travelRequestPage.waitForProductSearchInputs('rail');

      // Origin + destination stations via the rail autocomplete (boxed-autocomplete-popper).
      await travelRequestPage.fillRailOrigin(origin);
      await travelRequestPage.fillRailDestination(destination);

      // Departure date — next month, first available day.
      await travelRequestPage.openRailDepartureDatePicker();
      await clickNextVisibleMonth(page);
      await selectDatesByNthAvailable(page, { startIndex: 0 });
      await searchPage.waitForDatePickerToClose();

      // Return date — next month, a few days after departure.
      await travelRequestPage.openRailReturnDatePicker();
      await clickNextVisibleMonth(page);
      await selectDatesByNthAvailable(page, { startIndex: 3 });
      await searchPage.waitForDatePickerToClose();

      // Comment.
      await travelRequestPage.fillItemComment('rail', comment);
    } catch (err) {
      throw new Error(
        `[TravelRequest.addRailToRequestAssistance] Could not add the rail request item from "${origin}" to ` +
        `"${destination}" with comment "${comment}". A station autocomplete, the departure/return date, or the ` +
        `comment may not have been available. Original: ${err.message}`
      );
    }
    return { added: true, origin, destination, comment };
  },

  // ===== Review popup verifications =====

  /**
   * Verifies a reference/dynamic field label is shown in the travel-request review popup.
   * @param {import('@playwright/test').Page} page
   * @param {string} label - Field label text (e.g. "Payment Group")
   */
  async verifyReviewFieldLabel(page, label) {
    if (!page) throw new Error('[TravelRequest.verifyReviewFieldLabel] "page" is required.');
    if (!label || typeof label !== 'string') {
      throw new Error(`[TravelRequest.verifyReviewFieldLabel] "label" must be a non-empty string, got: ${typeof label}`);
    }
    const refPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const visible = await refPage.isFieldLabelVisible(label, { timeout: 30000 });
    expect(
      visible,
      `[TravelRequest.verifyReviewFieldLabel] Expected the travel-request review popup to display the field label "${label}".`
    ).toBe(true);
  },

  /**
   * Verifies the traveler name is shown in the travel-request review popup.
   * @param {import('@playwright/test').Page} page
   * @param {string} name - Traveler full name (e.g. "Ofira Refer")
   */
  async verifyReviewTravelerName(page, name) {
    if (!page) throw new Error('[TravelRequest.verifyReviewTravelerName] "page" is required.');
    if (!name || typeof name !== 'string') {
      throw new Error(`[TravelRequest.verifyReviewTravelerName] "name" must be a non-empty string, got: ${typeof name}`);
    }
    const refPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const visible = await refPage.isTravelerNameVisible(name, { timeout: 30000 });
    expect(
      visible,
      `[TravelRequest.verifyReviewTravelerName] Expected the travel-request review popup to display the traveler name "${name}".`
    ).toBe(true);
  },

  /**
   * Verifies the Financial Reference field is NOT displayed in the travel-request popup — expected
   * for a user not assigned to the financial-reference group.
   * @param {import('@playwright/test').Page} page
   */
  async verifyFinancialReferenceNotDisplayed(page) {
    if (!page) throw new Error('[TravelRequest.verifyFinancialReferenceNotDisplayed] "page" is required.');
    const refPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const present = await refPage.isFinancialReferenceSectionPresent();
    expect(
      present,
      `[TravelRequest.verifyFinancialReferenceNotDisplayed] Expected the Financial Reference field to be ABSENT from ` +
      `the travel-request popup (the user is not assigned to the financial-reference group), but it was present.`
    ).toBe(false);
  },

  /**
   * Verifies the number of reference/dynamic fields shown in the travel-request review popup.
   * @param {import('@playwright/test').Page} page
   * @param {number} expectedCount - Expected number of reference/dynamic fields (e.g. 6)
   */
  async verifyReviewFieldCount(page, expectedCount) {
    if (!page) throw new Error('[TravelRequest.verifyReviewFieldCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(`[TravelRequest.verifyReviewFieldCount] "expectedCount" must be a non-negative integer, got: ${expectedCount}`);
    }
    const refPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const actual = await refPage.getReferenceFieldCount();
    expect(
      actual,
      `[TravelRequest.verifyReviewFieldCount] Expected the travel-request popup to show ${expectedCount} reference/dynamic fields, but found ${actual}.`
    ).toBe(expectedCount);
  },

  // ===== Trip requested-item comment =====

  /**
   * Verifies a requested item's comment is displayed in the trip Requests tab. Comments are unique
   * per product in this flow, so matching by comment text reliably targets the right item.
   * @param {import('@playwright/test').Page} page
   * @param {string} product - Product noun for the error message (e.g. "hotel", "car", "rail")
   * @param {string} expectedComment - The comment text expected on the requested item
   */
  async verifyRequestedItemComment(page, product, expectedComment) {
    if (!page) throw new Error('[TravelRequest.verifyRequestedItemComment] "page" is required.');
    if (!expectedComment || typeof expectedComment !== 'string') {
      throw new Error(`[TravelRequest.verifyRequestedItemComment] "expectedComment" must be a non-empty string, got: ${typeof expectedComment}`);
    }
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    try {
      const commentLocator = travelRequestPage.getRequestedItemComment(expectedComment).first();
      await expect(
        commentLocator,
        `[TravelRequest.verifyRequestedItemComment] Expected the requested ${product} item to show the comment "${expectedComment}" in the trip.`
      ).toBeVisible({ timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[TravelRequest.verifyRequestedItemComment] Could not confirm the requested ${product} item comment "${expectedComment}" in the trip. ` +
        `The Requests tab may not have loaded, or the comment was not saved on the requested item. Original: ${err.message}`
      );
    }
  },

};

/**
 * Reads a request-assistance form field (by key) and asserts it equals the expected value
 * (whitespace-normalized). Centralizes the guard + poll + assertion shared by every field verify.
 * On failure it distinguishes "the field never rendered" (selector matched nothing) from "the field
 * showed the wrong value", so a stale selector isn't misdiagnosed as a value mismatch.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} expected - Expected field value
 * @param {string} fieldKey - Request-assistance field key (see REQUEST_FIELD_SELECTORS)
 * @param {string} fieldLabel - Human-readable field name for error messages
 */
async function assertRequestFieldValue(page, expected, fieldKey, fieldLabel) {
  if (!page) throw new Error(`[TravelRequest] "page" is required to verify the ${fieldLabel}.`);
  if (!expected || typeof expected !== 'string') {
    throw new Error(
      `[TravelRequest] Expected ${fieldLabel} value must be a non-empty string, got: ${typeof expected}. ` +
      `For date fields, ensure "I extract departure and return dates" ran first to capture them.`
    );
  }
  const travelRequestPage = getPageObject(page, TravelRequestPage);
  // Poll: request-assistance field values can settle after render (notably the parallel hotel
  // destination, inherited reactively from the flight). Retrying mirrors the Testim waitForText the
  // original test used, so a still-loading value doesn't fail on the first read.
  try {
    await expect
      .poll(async () => normalizeText(await travelRequestPage.getRequestFieldValue(fieldKey)), {
        timeout: 30000,
        message: `[TravelRequest] Expected the request-assistance ${fieldLabel} to show "${expected}".`,
      })
      .toBe(normalizeText(expected));
  } catch (err) {
    // Disambiguate a stale/missing selector (0 matches) from a genuine value mismatch — the poll
    // reads an empty string in both cases, so without this a "field not found" reads as "wrong value".
    const count = await travelRequestPage.getRequestFieldLocator(fieldKey).count().catch(() => 0);
    if (count === 0) {
      throw new Error(
        `[TravelRequest] The request-assistance ${fieldLabel} field never rendered — its selector matched 0 elements. ` +
        `Expected "${expected}". The field may be missing from the form or its selector may be stale.`
      );
    }
    throw err;
  }
}

/**
 * Reads a request-assistance form field (by key) and asserts it CONTAINS the expected substring
 * (whitespace-normalized, case-insensitive). Used for fields that carry a fuller label than the value
 * under test — e.g. the flight origin/destination inputs hold the full airport string, of which the
 * test only pins the city. Mirrors assertRequestFieldValue's guard + poll + missing-selector
 * disambiguation.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} expectedSubstring - Text the field value must contain
 * @param {string} fieldKey - Request-assistance field key (see REQUEST_FIELD_SELECTORS)
 * @param {string} fieldLabel - Human-readable field name for error messages
 */
async function assertRequestFieldContains(page, expectedSubstring, fieldKey, fieldLabel) {
  if (!page) throw new Error(`[TravelRequest] "page" is required to verify the ${fieldLabel}.`);
  if (!expectedSubstring || typeof expectedSubstring !== 'string') {
    throw new Error(
      `[TravelRequest] Expected ${fieldLabel} substring must be a non-empty string, got: ${typeof expectedSubstring}.`
    );
  }
  const travelRequestPage = getPageObject(page, TravelRequestPage);
  const normalizedExpected = normalizeText(expectedSubstring).toLowerCase();
  try {
    await expect
      .poll(async () => normalizeText(await travelRequestPage.getRequestFieldValue(fieldKey)).toLowerCase(), {
        timeout: 30000,
        message: `[TravelRequest] Expected the request-assistance ${fieldLabel} to contain "${expectedSubstring}".`,
      })
      .toContain(normalizedExpected);
  } catch (err) {
    // Disambiguate a stale/missing selector (0 matches) from a genuine mismatch, same as
    // assertRequestFieldValue — the poll reads "" in both cases otherwise.
    const count = await travelRequestPage.getRequestFieldLocator(fieldKey).count().catch(() => 0);
    if (count === 0) {
      throw new Error(
        `[TravelRequest] The request-assistance ${fieldLabel} field never rendered — its selector matched 0 elements. ` +
        `Expected it to contain "${expectedSubstring}". The field may be missing from the form or its selector may be stale.`
      );
    }
    throw err;
  }
}

module.exports = TravelRequest;
