/**
 * TravelRequest DSL
 *
 * High-level business actions for travel request flows.
 *
 * Exposes business-level methods for sending a flight travel request.
 */
const { getPageObject } = require("@utils/pageObjectCache");
const { FlightSearch } = require("./FlightSearch");
const { TravelRequestPage } = require("@pages/TravelRequestPage");
const { CheckoutPage } = require("@pages/CheckoutPage");

const TravelRequest = {
  /**
   * Sends a flight travel request:
   * - Clicks the travel request button (if needed)
   * - Performs a round trip flight search (general route)
   * - Clicks the "Send Request" button
   *
   * @param {import('@playwright/test').Page} page
   */
  async sendFlightTravelRequest(page) {
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    // Click "Travel Request" button if needed (not specified in UI)
    await travelRequestPage.clickTravelRequestButton();

    // Search for a round trip flight (general route)
    await FlightSearch.searchFlightRoundTrip(page);

    // Click the "Send Request" button
    await travelRequestPage.clickSendRequestButton();
  },

  async navigateToTravelRequestTrip(page) {
    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.clickGoToTripButton();
    
  }

};

module.exports = TravelRequest;
