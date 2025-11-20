// pages/MenuPage.js
class MenuPage {
  constructor(page) {
    this.page = page;
  }

  // Wait for "Book a New Trip" icon
  async waitForBookANewTripIcon() {
    console.log('Waiting for "Book a New Trip" icon...');
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(1000);
  }

  // Click "Book a New Trip"
  async clickBookANewTrip() {
    console.log('Click "Book a New Trip"');
    await this.page.click('.top-container > :nth-child(4) .material-symbols-outlined');
  }

  // High-level action: wait and then click
  async bookANewTrip() {
    await this.waitForBookANewTripIcon();
    await this.clickBookANewTrip();
  }
}

module.exports = MenuPage;
