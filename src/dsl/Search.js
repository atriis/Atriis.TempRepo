const { SearchPage } = require("@pages/SearchPage");
const { generateRandomGuestData } = require("@utils/data/generateRandomGuestData.js");

/**
 * Search (Domain DSL)
 *
 * Business actions for the traveler section.
 * Keeps tests readable by hiding UI form details.
 */
const Search = {
  /**
   * Set the logged-in user as the traveler.
   * UI should show the "star" icon as confirmation.
   */
  async addMeAsTraveler(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const { expect } = require('@playwright/test');
    const searchPage = new SearchPage(page);
    await searchPage.waitForAddMeButton();
    await searchPage.clickAddMe();
    
    const starIconVisible = await searchPage.isStarIconVisible();
    expect(starIconVisible, "Star icon should be visible after adding traveler").toBe(true);
  },

  /**
   * Set a specific existing traveler by searching their name.
   * UI should show the "star" icon as confirmation.
   */
  async fillInTravelerNameAndSave(page, name) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!name || typeof name !== 'string') {
      throw new Error('name must be a non-empty string');
    }
    
    const { expect } = require('@playwright/test');
    const searchPage = new SearchPage(page);
    await searchPage.fillInTravelerName(name);
    await searchPage.selectFirstTravelerNameOption();
    
    const starIconVisible = await searchPage.isStarIconVisible();
    expect(starIconVisible, "Star icon should be visible after selecting traveler").toBe(true);
  },

  /**
   * Add a traveler by name (second traveler slot).
   */
  async addTravelerByName(page, name) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!name || typeof name !== 'string') {
      throw new Error('name must be a non-empty string');
    }
    
    const searchPage = new SearchPage(page);
    await searchPage.clickAddTravelerButton();
    await Search.fillInTravelerNameAndSave(page, name);
  },

  /**
   * Add a new guest traveler using random test data.
   * Returns the generated data for test/debug use.
   */
  async addRandomGuest(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const { expect } = require('@playwright/test');
    const searchPage = new SearchPage(page);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickAddGuestTravelerButton();
    await searchPage.fillInRandomFirstName(firstName);
    // The SearchPage method name is used exactly as in your project
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    await searchPage.clickAddGuestButton();
    
    const starIconVisible = await searchPage.isStarIconVisible();
    expect(starIconVisible, "Star icon should be visible after adding guest").toBe(true);

    return {
      added: true,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },
};

module.exports = Search;
