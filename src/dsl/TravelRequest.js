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
const { TravelRequestPage } = require("@pages/TravelRequestPage");
const { CommonPage } = require("@pages/CommonPage");

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
