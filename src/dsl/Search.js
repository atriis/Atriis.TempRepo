const { SearchPage } = require('@pages/SearchPage');
const { generateRandomGuestData } = require('@utils/data/generateRandomGuestData.js');

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
    const searchPage = new SearchPage(page);
    await searchPage.waitForAddMeButton();
    await searchPage.clickAddMe();
    await searchPage.waitForStarIcon();
  },

  /**
   * Set a specific existing traveler by searching their name.
   * UI should show the "star" icon as confirmation.
   */
  async fillInTravellerNameAndSave(page, name) {
    const searchPage = new SearchPage(page);
    await searchPage.fillInTravellerName(name);
    await searchPage.selectFirstTravellerNameOption();
    await searchPage.waitForStarIcon();
  },

  /**
   * Add a traveler by name (second traveler slot).
   */
  async addTravellerByName(page, name) {
    const searchPage = new SearchPage(page);
    await searchPage.clickAddTravelerButton();
    await Search.fillInTravellerNameAndSave(page, name);
  },

  /**
   * Add a second traveler by name (after first traveler).
   */
  async addSecondTravellerByName(page, name) {
    const searchPage = new SearchPage(page);
    await searchPage.clickAddTravelerButton();
    await Search.fillInTravellerNameAndSave(page, name);
  },

  /**
   * Add a new guest traveler using random test data.
   * Returns the generated data for test/debug use.
   */
  async addFirstRandomGuest(page) {
    const searchPage = new SearchPage(page);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickGuestTypeModal();
    await searchPage.fillInRandomFirstName(firstName);
    // The SearchPage method name is used exactly as in your project
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    await searchPage.clickToAddGuestModal();
    await searchPage.waitForStarIcon();

    return {
      added: true,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },
};

module.exports = Search;