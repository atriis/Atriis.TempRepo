/**
 * Page Object for Amtrak results page.
 * Contains only UI-level interactions.
 */

class AmtrakResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the "More details" button for the first Amtrak result.
   */
  async clickMoreDetailsButton() {
    await this.page.getByRole('button', { name: 'More details' }).first().click();
  }
}

module.exports = AmtrakResultsPage;
