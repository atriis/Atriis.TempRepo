/**
 * Page Object for travel request page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  FLIGHT_SERVICE_BUTTON: ".product-btn",
  FLIGHT_SEARCH_INPUTS: ".flight-search-inputs",
  DEPARTURE_DATE_INPUT: "input[placeholder*='Depart']",
};

class TravelRequestPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the "Flight" service button in the "Add more services" section.
   * This renders the flight-search-inputs form.
   */
  async clickFlightButton() {
    await this.page
      .locator(SELECTORS.FLIGHT_SERVICE_BUTTON)
      .filter({ hasText: 'Flight' })
      .click();
  }

  /**
   * Waits for the flight-search-inputs form to be visible after clicking the Flight button.
   */
  async waitForFlightSearchInputs() {
    await this.page
      .locator(SELECTORS.FLIGHT_SEARCH_INPUTS)
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Opens the departure date picker in the Travel Request flight form.
   * Checks if the picker is already open (TAB from To field may auto-open it)
   * to avoid a toggle-close by clicking an already-open picker.
   */
  async clickDepartureDateField() {
    const panel = this.page.locator('.el-picker-panel');

    // If picker is already open (e.g. TAB from To field focused this input), don't click again
    const isAlreadyOpen = await panel.isVisible().catch(() => false);

    if (!isAlreadyOpen) {
      const field = this.page.locator(SELECTORS.DEPARTURE_DATE_INPUT).first();
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await panel.first().waitFor({ state: 'visible', timeout: 10000 });
    }

    // Wait for Popper.js to finish repositioning the floating panel
    await this.page.waitForTimeout(600);
  }

  /**
   * Gets the "Send request" button locator.
   */
  getSendRequestButton() {
    return this.page.getByRole("button", { name: "Send request" });
  }

  /**
   * Waits for "Send request" button to be enabled and clicks it.
   */
  async clickSendRequestButton() {
    await this.getSendRequestButton().waitFor({ state: 'visible', timeout: 15000 });
    await this.getSendRequestButton().click();
  }

  /**
   * Gets the "Sent to agent" confirmation message locator.
   */
  getSentToAgentMessage() {
    return this.page.getByText("Sent to agent", { exact: true });
  }

  async waitForSentToAgentMessage() {
    await this.getSentToAgentMessage().waitFor({ state: "visible", timeout: 30000 });
  }
}

module.exports = { TravelRequestPage, SELECTORS };
