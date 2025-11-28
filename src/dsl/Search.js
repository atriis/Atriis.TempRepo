const SearchPage = require('../pages/SearchPage');
const { generateRandomGuestData } = require('../utils/data/generateRandomGuestData.js');

const Search = {
  // Sets the logged user as the traveler for the booking
  async addTravellerImTheTraveller(page) {
    console.log('Adding logged-in user as the traveler...');
    const searchPage = new SearchPage(page);

    await searchPage.clickTravelerIcon();
    await searchPage.clickImTheTraveler();
    await searchPage.waitForStarIcon();

    console.log('Successfully set logged-in user as traveler');
    return { added: true };
  },

  // Sets specific user as the traveler for the booking
  async addTravellerByName(page, name) {
    console.log('Adding traveller by name...');
    const searchPage = new SearchPage(page);

    await searchPage.clickTravelerIcon();
    await searchPage.waitForImTheTravelerButton();
    await searchPage.fillInTravellerName(name);
    await searchPage.selectFirstTravellerOption();
    await searchPage.waitForStarIcon();

    console.log('Successfully added traveller by name');
    return { added: true };
  },

  // Adds a guest with random data as the traveler for the booking
  async addFirstRandomGuest(page) {
    console.log('Adding random guest as traveler...');
    const searchPage = new SearchPage(page);

    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();
    console.log(`Generated guest data: ${firstName} ${lastName}`);

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

    console.log('Successfully added random guest as traveler');
    return {
      added: true,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },
};

module.exports = Search;
