const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  OUTBOUND_TEXT: 'h3',
  SUGGESTED_FARES_TEXT: '.price-container.mb-5 .desc',
  CHEAPEST_SUGGESTED_FARE: '.suggested-btn .app-price',
  ADD_TO_TRIP_BUTTON: '.btn.btn--primary'
};

class EvolviResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Outbound" text to appear on the Evolvi results page
  // Confirms that search results have loaded and are ready for interaction
  async waitForOutboundText() {
    console.log('Waiting for Outbound text to appear...');
    await waitForText(this.page, SELECTORS.OUTBOUND_TEXT, 'Outbound');
    await this.page.waitForTimeout(4000); // Extra wait for stability
    console.log('Outbound text appeared successfully');
  }

  // Waits for the "Suggested fares" text to appear in the price container
  // Indicates that fare options have loaded and are available for selection
  async waitForSuggestedFaresText() {
    console.log('Waiting for Suggested Fares text to appear...');
    await waitForText(this.page, SELECTORS.SUGGESTED_FARES_TEXT, 'Suggested fares');
    await this.page.waitForTimeout(4000);
    console.log('Suggested Fares text appeared successfully');
  }

  // Clicks the cheapest suggested fare option from the available fare recommendations
  // Selects the most cost-effective fare option for the Evolvi journey
  async clickCheapestSuggestedFareOption() {
    console.log('Clicking Suggested Fare option...');
    await this.page.locator(SELECTORS.CHEAPEST_SUGGESTED_FARE).click();
    console.log('Suggested Fare option clicked successfully');
  }

  // Waits for the "Add to trip" button to appear and become ready for interaction
  // Confirms that the Evolvi option can be added to the current trip booking
  async waitForAddToTripButton() {
    console.log('Waiting for Add to trip button to appear...');
    await waitForText(this.page, SELECTORS.ADD_TO_TRIP_BUTTON, 'Add to trip');
    await this.page.waitForTimeout(4000); // Extra wait for stability
    console.log('Add to trip button appeared successfully');
  }

  // Clicks the "Add to trip" button to add the selected Evolvi option to the current trip
  // Completes the process of adding the chosen train journey to the booking
  async clickAddToTripButton() {
    console.log('Clicking Evolvi Add to trip button...');
    await this.page.locator(SELECTORS.ADD_TO_TRIP_BUTTON).click();
    console.log('Evolvi option added to trip successfully');
  }
}

module.exports = EvolviResultsPage;