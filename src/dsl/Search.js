const { getPageObject } = require("@utils/pageObjectCache");
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
   * Returns whether the star icon is visible (indicates success).
   */
  async addMeAsTraveler(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitForAddMeButton();
    await searchPage.clickAddMe();
    
    const starIconVisible = await searchPage.isStarIconVisible();
    return { added: true, starIconVisible };
  },

  /**
   * Removes the logged-in traveler from the trip.
   * Returns whether the Add Me button becomes visible again.
   */
  async removeTraveler(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitForTravelerTagVisible();
    await searchPage.clickRemoveTravelerButton();
    await searchPage.waitForAddMeButton();

    return { removed: true };
  },

  /**
   * Set a specific existing traveler by searching their name.
   * Returns whether the star icon is visible (indicates success).
   */
  async fillInTravelerNameAndSave(page, name) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!name || typeof name !== 'string') {
      throw new Error('name must be a non-empty string');
    }
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.fillInTravelerName(name);
    await searchPage.selectFirstTravelerNameOption();
    
    const starIconVisible = await searchPage.isStarIconVisible();
    return { selected: true, starIconVisible };
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
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickAddTravelerButton();
    return await Search.fillInTravelerNameAndSave(page, name);
  },

  /**
   * Add a new guest traveler using random test data.
   * Returns the generated data and star icon visibility status.
   */
  async addRandomGuest(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const searchPage = getPageObject(page, SearchPage);
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

    return {
      added: true,
      starIconVisible,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },

  /**
   * Validates that the search title contains specific text.
   * @param {Object} page - Playwright page instance
   * @param {string} text - Expected text in search title
   * @throws {Error} If page or text are missing
   */
  async validateSearchTitleContains(page, text) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!text || typeof text !== 'string') {
      throw new Error('text must be a non-empty string');
    }
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.validateSearchTitleContains(text);
  }
};

module.exports = Search;
