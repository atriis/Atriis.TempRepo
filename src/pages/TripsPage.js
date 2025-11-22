
// Centralized selectors for easy maintenance
const SELECTORS = {
  // "Found X Trips" block
  foundTripsText:
    'div.is-flex.is-align-items-center.is-flex-gap-1',
  // "Trip Status" title in the filter panel
  tripStatusFilterIcon:
    'h4.filter-title.is-size-6:has-text("Trip Status")'
};

class TripsPage {
  constructor(page) {
    this.page = page;
  }

  // Wait for the "Found Trips" text block
  async waitForFoundTripsText() {
    console.log('Waiting for "Found Trips" text...');
    await this.page.waitForTimeout(2000);
    // Use Playwright's text locator instead of CSS selector with :has-text()
    await this.page.locator('text=Found').first().waitFor({ state: 'visible', timeout: 10000 });
  }

  // Wait for the "Trip Status" section title
  async tripStatusFilterTextDisplayed() {
    console.log('Waiting for Filter "Trip Status" text...');
    await this.page.locator(SELECTORS.tripStatusFilterIcon).waitFor({ state: 'visible' });
  }
}

module.exports = TripsPage;
