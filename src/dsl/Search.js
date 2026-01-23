const { SearchPage } = require('@pages/SearchPage');
const { generateRandomGuestData } = require('@utils/data/generateRandomGuestData.js');

/**
 * Search (Domain DSL)
 *
 * This file contains business actions related to the traveler section.
 * It keeps tests readable by hiding form details.
 */
const Search = {
  /**
   * Sets the logged-in user as the traveler.
   * After this step, the UI should show the "star" icon as confirmation.
   */
  async addTravellerImTheTraveller(page) {
    const searchPage = new SearchPage(page);

    await searchPage.clickTravelerIcon();
    await searchPage.clickImTheTraveler();
    await searchPage.waitForStarIcon();

    return { added: true };
  },

  /**
   * Sets a specific existing traveler by searching their name.
   * After selection, the UI should show the "star" icon as confirmation.
   */
  async addTravellerByName(page, name) {
    const searchPage = new SearchPage(page);

    await searchPage.clickTravelerIcon();
    await searchPage.waitForImTheTravelerButton();
    await searchPage.fillInTravellerName(name);
    await searchPage.selectFirstTravellerOption();
    await searchPage.waitForStarIcon();

    return { added: true };
  },

  /**
   * Adds a new guest traveler using random test data.
   * Returns the generated data so the test (or debug logs) can use it if needed.
   */
  async addFirstRandomGuest(page) {
    const searchPage = new SearchPage(page);

    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickTravelerIcon();
    await searchPage.clickGuestTypeModal();

    await searchPage.fillInRandomFirstName(firstName);
    // Keep as-is: the SearchPage method name is used exactly as in your project
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