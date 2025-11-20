// pages/CarResultsPage.js
const { waitForText } = require('../utils');

class CarResultsPage {
  constructor(page) {
    this.page = page;
  }

  async waitForCarAddToTripText() {
    await waitForText(
      this.page,
      ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']",
      "Add to trip"
    );
  }

  async clickCarAddToTripButton() {
    await this.page.click(".car-list > :nth-child(1) .desktop-btn");
  }

  async waitForSelectText() {
    await waitForText(this.page, ".btn--primary", "Select");
  }

  async clickSelectButton() {
    await this.page.click(".btn--primary");
  }
}

module.exports = CarResultsPage;
