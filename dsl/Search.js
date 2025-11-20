const SearchPage = require('../pages/SearchPage');
const { generateRandomGuestData } = require('../utils/test-data');

const Search = {
  
  /**
   * High-level DSL action:
   * Add "I am the traveler"
   */
  async addTravelerImTheTraveller(page) {
    const searchPage = new SearchPage(page);

    await searchPage.clickTravelerIcon();
    await searchPage.clickImTheTraveler();
    await searchPage.waitForStarIcon();

    return { added: true };
  },

  /**
   * High-level DSL action:
   * Add first random guest traveler
   * (values must be generated before calling)
   */

   //Not working yet, use addTravelerImTheTraveller instead
    async addFirstRandomGuest(page) {
    const searchPage = new SearchPage(page);

    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();
    
    await searchPage.clickTravelerIcon();
    await searchPage.clickGuestTypeModal();

    await searchPage.fillInRandomFirstName(firstName);
    await searchPage.fillInRandonLastName(lastName);
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
