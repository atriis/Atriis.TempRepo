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
    await searchPage.waitForTravelerTagVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return { added: true, starIconVisible: true, selectedTravelerCount };
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
    const result = await Search.fillInTravelerNameAndSave(page, name);
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      ...result,
      selectedTravelerCount,
    };
  },

  /**
   * Add a new guest traveler using random test data.
   * Returns the generated data and star icon visibility status.
   *
   * @param {import('playwright').Page} page
   * @param {string} [phoneType] - Optional visible phone-type label
   *   (e.g. "Cellular phone"). Required for users whose corporate profile
   *   does not pre-populate a default phone type, where leaving it blank
   *   fails form validation and prevents the add-guest dialog from closing.
   */
  async addRandomGuest(page, phoneType = null) {
    if (!page) {
      throw new Error('page is required');
    }
    if (phoneType !== null && (typeof phoneType !== 'string' || phoneType.length === 0)) {
      throw new Error('phoneType, when provided, must be a non-empty string');
    }

    const searchPage = getPageObject(page, SearchPage);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickAddGuestTravelerButton();
    await searchPage.fillInRandomFirstName(firstName);
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    if (phoneType) {
      await searchPage.selectPhoneType(phoneType);
    }
    await searchPage.clickAddGuestButton();

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth, email, phone, phoneType },
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
  },

  /**
   * Add a traveler by name and set them as primary.
   * @param {import('playwright').Page} page
   * @param {string} name - traveler name to search for
   */
  async addTravelerAsPrimaryByName(page, name) {
    if (!page) throw new Error('page is required');
    if (!name || typeof name !== 'string') throw new Error('name must be a non-empty string');

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickAddTravelerButton();
    // Wait for the edit-traveler panel to appear
    await page.locator('.edit-traveler').waitFor({ state: 'visible', timeout: 10000 });
    await searchPage.checkPrimaryTravelerCheckbox();
    // Fill the autocomplete inside the edit-traveler panel (scoped)
    await searchPage.fillInEditTravelerName(name);
    await searchPage.selectEditTravelerOption();
    // Wait for the traveler to be selected
    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return { selected: true, starIconVisible, selectedTravelerCount };
  },

  /**
   * Adds a random guest traveler with a specific first and last name.
   * All other data (DOB, email, phone) is randomly generated.
   * @param {Object} page - Playwright page instance
   * @param {string} firstName - Guest's first name
   * @param {string} lastName - Guest's last name
   * @returns {{ added: boolean, starIconVisible: boolean, guestData: Object }}
   */
  async addRandomGuestWithName(page, firstName, lastName) {
    if (!page) throw new Error('page is required');
    if (!firstName || typeof firstName !== 'string') throw new Error('firstName must be a non-empty string');
    if (!lastName || typeof lastName !== 'string') throw new Error('lastName must be a non-empty string');

    const searchPage = getPageObject(page, SearchPage);
    const { dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickAddGuestTravelerButton();
    await searchPage.fillInRandomFirstName(firstName);
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    await searchPage.clickAddGuestButton();

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },

  /**
   * Adds a random guest traveler whose first name is padded with leading and
   * trailing spaces. Used to verify that the booking flow trims whitespace
   * from names before sending them to the supplier (e.g. Fusion ProcessTerms).
   *
   * @param {Object} page - Playwright page instance
   * @returns {Promise<{added: boolean, starIconVisible: boolean, selectedTravelerCount: number, guestData: Object}>}
   */
  async addRandomGuestWithSpacesInFirstName(page) {
    if (!page) throw new Error('page is required');

    const { firstName, lastName } = generateRandomGuestData();
    const paddedFirstName = ` ${firstName} `;
    return Search.addRandomGuestWithName(page, paddedFirstName, lastName);
  },

  /**
   * Adds a random guest traveler and fills the middle-name input with the
   * provided value. First/last name, DOB, email and phone are auto-generated.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} middleName - Middle name to fill in the guest form
   * @returns {Promise<{added: boolean, starIconVisible: boolean, selectedTravelerCount: number, guestData: Object}>}
   */
  async addRandomGuestWithMiddleName(page, middleName) {
    if (!page) throw new Error('page is required');
    if (!middleName || typeof middleName !== 'string') {
      throw new Error('middleName must be a non-empty string, got: ' + middleName);
    }

    const searchPage = getPageObject(page, SearchPage);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickAddGuestTravelerButton();
    await searchPage.fillInRandomFirstName(firstName);
    await searchPage.fillInGuestMiddleName(middleName);
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    await searchPage.clickAddGuestButton();

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, middleName, lastName, dateOfBirth, email, phone },
    };
  },
};

module.exports = Search;
