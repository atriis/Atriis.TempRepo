const SearchPage = require('../pages/SearchPage');
const { generateRandomGuestData } = require('../utils/data/generateRandomGuestData.js');

const Search = {
  // Sets the logged user as the traveler for the booking
  async addTravelerImTheTraveller(page) {
    const searchPage = new SearchPage(page);

    await searchPage.clickTravelerIcon();
    await searchPage.clickImTheTraveler();
    await searchPage.waitForStarIcon();

    return { added: true };
  },

  // Adds a guest with random data as the traveler for the booking
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
