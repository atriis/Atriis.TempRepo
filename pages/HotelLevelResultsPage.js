// pages/HotelLevelResultsPage.js
const { waitForText } = require('../utils/wait');

class HotelLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  async waitForViewRatesText() {
    await waitForText(
      this.page,
      ".hotel-list > :nth-child(1) .extra-info a",
      "View rates"
    );
  }

  async clickViewRatesButtonFirstHotel() {
    await this.page.click(".hotel-list > :nth-child(1) .btn--primary");
  }

}

module.exports = HotelLevelResultsPage;
