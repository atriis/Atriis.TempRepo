/**
 * Page Object for travel request page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  SEND_REQUEST_BUTTON: "button:has-text('Send Request')",
};

class TravelRequestPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the "Send Request" button.
   */
  getSendRequestButton() {
    return this.page.getByRole("button", { name: "Send Request" });
  }

  clickSendRequestButton() {
    return this.getSendRequestButton().click();
  }

  // 'Sent to agent' message appears after sending the request
  getSentToAgentMessage() {
    return this.page.getByText("Sent to agent", { exact: true });
  }

  async waitForSentToAgentMessage() {
    await this.getSentToAgentMessage().waitFor({ state: "visible", timeout: 30000 });
  }
}

module.exports = { TravelRequestPage, SELECTORS };
