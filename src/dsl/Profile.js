const { getPageObject } = require("@utils/pageObjectCache");
const ProfilePage = require("@pages/ProfilePage");
const LoginPage = require("@pages/LoginPage");
const logger = require("@utils/logger").child("Profile");

/**
 * Profile DSL
 *
 * High-level actions for user profile management.
 * Describes WHAT the user does in their profile.
 */
const Profile = {
  /**
   * Navigates to the user profile by hovering the avatar and clicking the profile link.
   * The profile opens in a new tab — returns the new page instance.
   */
  async navigateToProfile(page) {
    if (!page) {
      throw new Error('[Profile.navigateToProfile] "page" is required.');
    }

    logger.debug("[Profile.navigateToProfile] Hovering avatar and clicking profile link");

    const profilePage = getPageObject(page, ProfilePage);
    const loginPage = getPageObject(page, LoginPage);
    const context = page.context();

    if (!context) {
      throw new Error('[Profile.navigateToProfile] Page context is null — cannot detect new tab.');
    }

    // Cookie consent banner can overlay the avatar — dismiss it first
    await loginPage.acceptCookiesIfPresent(8000);

    // Profile opens in a new window — listen for it before clicking
    const newPagePromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.hoverAvatar();
      await profilePage.clickProfileLink();
    } catch (err) {
      throw new Error(
        `[Profile.navigateToProfile] Failed to navigate to user profile: ${err.message}`
      );
    }

    const newProfilePage = await newPagePromise;

    if (newProfilePage) {
      logger.info("[Profile.navigateToProfile] Profile opened in a new tab");
      await newProfilePage.waitForLoadState("domcontentloaded", { timeout: 30000 });
      return newProfilePage;
    }

    // Fallback: profile opened in same tab
    logger.info("[Profile.navigateToProfile] Profile opened in current tab (no new tab detected)");
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
    return page;
  },

  /**
   * Opens the Frequent Programs tab in the user profile.
   */
  async openFrequentProgramsTab(page) {
    if (!page) {
      throw new Error('[Profile.openFrequentProgramsTab] "page" is required.');
    }

    logger.debug("[Profile.openFrequentProgramsTab] Clicking Frequent Programs tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickFrequentProgramsTab();
      await profilePage.waitForFrequentProgramsForm();
    } catch (err) {
      throw new Error(
        `[Profile.openFrequentProgramsTab] Failed to open Frequent Programs tab: ${err.message}`
      );
    }
  },

  /**
   * Removes a FQTV entry by number: clicks delete, confirms the dialog, verifies removal.
   * If the entry doesn't exist (already removed), skips gracefully.
   */
  async removeFqtvEntry(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.removeFqtvEntry] "page" is required.');
    }
    if (!fqtvNumber || typeof fqtvNumber !== "string") {
      throw new Error(
        `[Profile.removeFqtvEntry] "fqtvNumber" must be a non-empty string, got: ${typeof fqtvNumber} (${JSON.stringify(fqtvNumber)})`
      );
    }

    logger.debug(`[Profile.removeFqtvEntry] Removing FQTV entry "${fqtvNumber}"`);

    const profilePage = getPageObject(page, ProfilePage);

    // Check if the entry exists before attempting removal
    const entryExists = await profilePage.isFqtvEntryVisible(fqtvNumber);
    if (!entryExists) {
      logger.info(`[Profile.removeFqtvEntry] FQTV entry "${fqtvNumber}" not found — already removed, skipping`);
      return { skipped: true, reason: "entry not present" };
    }

    try {
      await profilePage.clickRemoveOnEntry(fqtvNumber);
      await profilePage.confirmDeleteDialog();
      // Wait for the entry to disappear from the DOM after deletion
      await profilePage.waitForEntryToDisappear(fqtvNumber);
    } catch (err) {
      throw new Error(
        `[Profile.removeFqtvEntry] Failed to remove FQTV entry "${fqtvNumber}": ${err.message}`
      );
    }

    return { skipped: false };
  },

  /**
   * Verifies that a FQTV entry is no longer visible in the profile.
   */
  async verifyFqtvEntryRemoved(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.verifyFqtvEntryRemoved] "page" is required.');
    }

    logger.debug(`[Profile.verifyFqtvEntryRemoved] Verifying FQTV entry "${fqtvNumber}" is removed`);

    const profilePage = getPageObject(page, ProfilePage);

    const isStillVisible = await profilePage.isFqtvEntryVisible(fqtvNumber);
    if (isStillVisible) {
      throw new Error(
        `[Profile.verifyFqtvEntryRemoved] FQTV entry "${fqtvNumber}" is still visible in the profile — ` +
        `deletion may not have been processed by the server.`
      );
    }
  },

  /**
   * Adds a new FQTV entry: clicks Add, selects first airline, fills number, saves.
   */
  async addFqtvEntry(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.addFqtvEntry] "page" is required.');
    }
    if (!fqtvNumber || typeof fqtvNumber !== "string") {
      throw new Error(
        `[Profile.addFqtvEntry] "fqtvNumber" must be a non-empty string, got: ${typeof fqtvNumber} (${JSON.stringify(fqtvNumber)})`
      );
    }

    logger.debug(`[Profile.addFqtvEntry] Adding FQTV entry "${fqtvNumber}" with first available airline`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickAddFrequentFlyer();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to click "Add Frequent Flyer" button: ${err.message}`
      );
    }

    try {
      await profilePage.selectFirstAirlineFromDropdown();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to select airline from dropdown for entry "${fqtvNumber}": ${err.message}`
      );
    }

    try {
      await profilePage.fillFqtvNumber(fqtvNumber);
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to fill FQTV number "${fqtvNumber}": ${err.message}`
      );
    }

    try {
      await profilePage.clickSaveFrequentPrograms();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to save after adding FQTV entry "${fqtvNumber}": ${err.message}`
      );
    }
  },

  /**
   * Opens the Contact Information tab in the user profile.
   */
  async openContactInformationTab(page) {
    if (!page) {
      throw new Error('[Profile.openContactInformationTab] "page" is required.');
    }

    logger.debug("[Profile.openContactInformationTab] Clicking Contact Information tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickContactInformationTab();
      await profilePage.waitForContactInfoForm();
    } catch (err) {
      throw new Error(
        `[Profile.openContactInformationTab] Failed to open Contact Information tab: ${err.message}`
      );
    }
  },

  /**
   * Verifies the business phone number fields display the expected values.
   */
  async verifyBusinessPhoneNumber(page, { countryCode, areaCode, number }) {
    if (!page) {
      throw new Error('[Profile.verifyBusinessPhoneNumber] "page" is required.');
    }
    if (typeof countryCode !== 'string' || typeof areaCode !== 'string' || typeof number !== 'string') {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] "countryCode", "areaCode", and "number" must all be strings, got: ` +
        `countryCode=${typeof countryCode}, areaCode=${typeof areaCode}, number=${typeof number}`
      );
    }

    logger.debug(`[Profile.verifyBusinessPhoneNumber] Expecting: +${countryCode} (${areaCode}) ${number}`);

    const profilePage = getPageObject(page, ProfilePage);

    let actual;
    try {
      actual = await profilePage.getBusinessPhoneValues();
    } catch (err) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Failed to read business phone values: ${err.message}`
      );
    }

    if (actual.countryCode !== countryCode) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Country code mismatch — expected "${countryCode}", got "${actual.countryCode}". ` +
        `The user's profile may have different phone data than expected.`
      );
    }
    if (actual.areaCode !== areaCode) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Area code mismatch — expected "${areaCode}", got "${actual.areaCode}".`
      );
    }
    if (actual.number !== number) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Phone number mismatch — expected "${number}", got "${actual.number}".`
      );
    }

    return actual;
  },

  /**
   * Verifies the State dropdown field displays the expected value.
   */
  async verifyStateField(page, expectedValue) {
    if (!page) {
      throw new Error('[Profile.verifyStateField] "page" is required.');
    }
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyStateField] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyStateField] Expecting state field value: "${expectedValue}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actual;
    try {
      actual = await profilePage.getStateFieldValue();
    } catch (err) {
      throw new Error(
        `[Profile.verifyStateField] Failed to read state field value: ${err.message}`
      );
    }

    if (actual !== expectedValue) {
      throw new Error(
        `[Profile.verifyStateField] State field value mismatch — expected "${expectedValue}", got "${actual}". ` +
        `This field only appears for countries that have states (e.g., US, Canada). Check the user's business address country.`
      );
    }

    return actual;
  },

  /**
   * Opens the Permissions tab in the user profile.
   */
  async openPermissionsTab(page) {
    if (!page) {
      throw new Error('[Profile.openPermissionsTab] "page" is required.');
    }

    logger.debug("[Profile.openPermissionsTab] Clicking Permissions tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPermissionsTab();
    } catch (err) {
      throw new Error(
        `[Profile.openPermissionsTab] Failed to open Permissions tab: ${err.message}`
      );
    }
  },

  /**
   * Opens a permissions section (e.g., "Who can I book for") within the permissions tab.
   */
  async openPermissionsSection(page, sectionName) {
    if (!page) {
      throw new Error('[Profile.openPermissionsSection] "page" is required.');
    }
    if (!sectionName || typeof sectionName !== 'string') {
      throw new Error(
        `[Profile.openPermissionsSection] "sectionName" must be a non-empty string, got: ${typeof sectionName} (${JSON.stringify(sectionName)})`
      );
    }

    logger.debug(`[Profile.openPermissionsSection] Opening section "${sectionName}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPermissionsSection(sectionName);
    } catch (err) {
      throw new Error(
        `[Profile.openPermissionsSection] Failed to open section "${sectionName}": ${err.message}`
      );
    }
  },

  /**
   * Removes a user from the booking permissions list by clicking the trash icon and confirming.
   */
  async removeUserFromBookingPermissions(page) {
    if (!page) {
      throw new Error('[Profile.removeUserFromBookingPermissions] "page" is required.');
    }

    logger.debug("[Profile.removeUserFromBookingPermissions] Clicking trash icon on first arranger row");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickTrashIconOnFirstArranger();
    } catch (err) {
      throw new Error(
        `[Profile.removeUserFromBookingPermissions] Failed to click trash icon: ${err.message}`
      );
    }

    try {
      await profilePage.confirmRemoveUser();
    } catch (err) {
      throw new Error(
        `[Profile.removeUserFromBookingPermissions] Failed to confirm user removal: ${err.message}`
      );
    }

    // Wait for the table to update after removal
    await page.waitForTimeout(1500);
  },

  /**
   * Verifies that the user was removed by checking the table is empty or has fewer rows.
   */
  async verifyUserRemovedFromPermissions(page) {
    if (!page) {
      throw new Error('[Profile.verifyUserRemovedFromPermissions] "page" is required.');
    }

    logger.debug("[Profile.verifyUserRemovedFromPermissions] Checking table is empty");

    const profilePage = getPageObject(page, ProfilePage);

    const isEmpty = await profilePage.isArrangerTableEmpty();
    if (!isEmpty) {
      throw new Error(
        `[Profile.verifyUserRemovedFromPermissions] Arranger table is not empty after removal — ` +
        `the user may not have been removed, or the table did not refresh.`
      );
    }
  },

  /**
   * Adds a travel arranger by searching and selecting from the dropdown.
   */
  async addTravelArranger(page, arrangerName) {
    if (!page) {
      throw new Error('[Profile.addTravelArranger] "page" is required.');
    }
    if (!arrangerName || typeof arrangerName !== 'string') {
      throw new Error(
        `[Profile.addTravelArranger] "arrangerName" must be a non-empty string, got: ${typeof arrangerName} (${JSON.stringify(arrangerName)})`
      );
    }

    logger.debug(`[Profile.addTravelArranger] Searching and selecting "${arrangerName}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.fillTravelArrangerSearch(arrangerName);
    } catch (err) {
      throw new Error(
        `[Profile.addTravelArranger] Failed to fill search for "${arrangerName}": ${err.message}`
      );
    }

    // Wait for search results to populate from the server
    await page.waitForTimeout(2500);

    try {
      await profilePage.selectTravelArrangerFromDropdown();
    } catch (err) {
      throw new Error(
        `[Profile.addTravelArranger] Failed to select "${arrangerName}" from dropdown results: ${err.message}`
      );
    }
  },

  /**
   * Verifies the selected travel arranger matches the expected name.
   */
  async verifyTravelArranger(page, expectedName) {
    if (!page) {
      throw new Error('[Profile.verifyTravelArranger] "page" is required.');
    }
    if (!expectedName || typeof expectedName !== 'string') {
      throw new Error(
        `[Profile.verifyTravelArranger] "expectedName" must be a non-empty string, got: ${typeof expectedName} (${JSON.stringify(expectedName)})`
      );
    }

    logger.debug(`[Profile.verifyTravelArranger] Expecting travel arranger: "${expectedName}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actual;
    try {
      actual = await profilePage.getTravelArrangerSelectedText();
    } catch (err) {
      throw new Error(
        `[Profile.verifyTravelArranger] Failed to read selected travel arranger text: ${err.message}`
      );
    }

    if (actual.toLowerCase() !== expectedName.toLowerCase()) {
      throw new Error(
        `[Profile.verifyTravelArranger] Travel arranger mismatch — expected "${expectedName}", got "${actual}". ` +
        `The search/selection may have picked the wrong user, or the dropdown did not populate.`
      );
    }

    return actual;
  },

  /**
   * Opens a traveler's profile from the trip page by clicking their name link.
   * Profile opens in a new tab — returns the new page instance.
   */
  async openTravelerProfile(page, travelerName) {
    if (!page) {
      throw new Error('[Profile.openTravelerProfile] "page" is required.');
    }
    if (!travelerName || typeof travelerName !== 'string') {
      throw new Error(
        `[Profile.openTravelerProfile] "travelerName" must be a non-empty string, got: ${typeof travelerName} (${JSON.stringify(travelerName)})`
      );
    }

    logger.debug(`[Profile.openTravelerProfile] Opening profile for traveler "${travelerName}"`);

    const profilePage = getPageObject(page, ProfilePage);
    const context = page.context();

    const newPagePromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.clickTravelerNameLink(travelerName);
    } catch (err) {
      throw new Error(
        `[Profile.openTravelerProfile] Failed to click traveler name "${travelerName}": ${err.message}`
      );
    }

    const newProfilePage = await newPagePromise;

    if (newProfilePage) {
      logger.info(`[Profile.openTravelerProfile] Profile for "${travelerName}" opened in a new tab`);
      await newProfilePage.waitForLoadState("domcontentloaded", { timeout: 30000 });
      const newProfilePageObj = getPageObject(newProfilePage, ProfilePage);
      await newProfilePageObj.waitForPersonalDetailsForm();
      return newProfilePage;
    }

    // Fallback: profile opened in same tab
    logger.info(`[Profile.openTravelerProfile] Profile for "${travelerName}" opened in same tab`);
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
    await profilePage.waitForPersonalDetailsForm();
    return page;
  },

  /**
   * Verifies the city field value in contact information matches expected (case-insensitive).
   */
  async verifyCityFieldValue(page, expectedValue) {
    if (!page) {
      throw new Error('[Profile.verifyCityFieldValue] "page" is required.');
    }
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyCityFieldValue] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyCityFieldValue] Expecting city to contain: "${expectedValue}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualValue;
    try {
      actualValue = await profilePage.getCityInputValue();
    } catch (err) {
      throw new Error(
        `[Profile.verifyCityFieldValue] Failed to read city field value: ${err.message}`
      );
    }

    if (!actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
      throw new Error(
        `[Profile.verifyCityFieldValue] City field value "${actualValue}" does not contain expected "${expectedValue}". ` +
        `The city may not have been saved previously, or the wrong tab/section is displayed.`
      );
    }

    logger.info(`[Profile.verifyCityFieldValue] City field value "${actualValue}" contains expected "${expectedValue}"`);
  },

  /**
   * Clicks the Save button on the Contact Information form.
   */
  async saveContactInfo(page) {
    if (!page) {
      throw new Error('[Profile.saveContactInfo] "page" is required.');
    }

    logger.debug("[Profile.saveContactInfo] Clicking Save on Contact Information form");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSaveContactInfo();
    } catch (err) {
      throw new Error(
        `[Profile.saveContactInfo] Failed to save contact information: ${err.message}`
      );
    }

    logger.info("[Profile.saveContactInfo] Contact information saved");
  },

  /**
   * Edits the date of birth field by typing a valid adult date (30 years ago) directly into the input.
   * The datepicker uses 'DD MMM YYYY' format and the editable attribute allows direct text input.
   * Clicking the field first triggers resetFieldValueIfMasked to clear any masked value.
   * Returns the original DOB value for later verification.
   */
  async editDateOfBirth(page) {
    if (!page) {
      throw new Error('[Profile.editDateOfBirth] "page" is required.');
    }

    logger.debug("[Profile.editDateOfBirth] Reading current DOB, then editing");

    const profilePage = getPageObject(page, ProfilePage);

    let originalValue;
    try {
      originalValue = await profilePage.getDobInputValue();
    } catch (err) {
      throw new Error(
        `[Profile.editDateOfBirth] Failed to read current DOB value: ${err.message}`
      );
    }

    // Build an adult DOB: 30 years before today in 'DD MMM YYYY' format
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const adultDob = new Date();
    adultDob.setFullYear(adultDob.getFullYear() - 30);
    const dobString = `${String(adultDob.getDate()).padStart(2, '0')} ${MONTHS[adultDob.getMonth()]} ${adultDob.getFullYear()}`;

    logger.debug(`[Profile.editDateOfBirth] Typing adult DOB: "${dobString}"`);

    try {
      await profilePage.typeDobValue(dobString);
    } catch (err) {
      throw new Error(
        `[Profile.editDateOfBirth] Failed to type DOB value: ${err.message}`
      );
    }

    // Brief wait for the input to reflect the typed date
    await page.waitForTimeout(500);

    return { originalValue };
  },

  /**
   * Verifies the DOB field value has changed from the original value.
   */
  async verifyDobUpdated(page, originalValue) {
    if (!page) {
      throw new Error('[Profile.verifyDobUpdated] "page" is required.');
    }

    logger.debug(`[Profile.verifyDobUpdated] Checking DOB has changed from "${originalValue}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let currentValue;
    try {
      currentValue = await profilePage.getDobInputValue();
    } catch (err) {
      throw new Error(
        `[Profile.verifyDobUpdated] Failed to read DOB input value after edit: ${err.message}`
      );
    }

    if (currentValue === originalValue) {
      throw new Error(
        `[Profile.verifyDobUpdated] DOB field value did not change — still "${currentValue}". ` +
        `The date selection may not have been saved, or the field is disabled for this user.`
      );
    }

    logger.info(`[Profile.verifyDobUpdated] DOB changed from "${originalValue}" to "${currentValue}"`);
    return { originalValue, currentValue };
  },

  /**
   * Opens the Form of Payment tab in the user profile.
   */
  async openFormOfPaymentTab(page) {
    if (!page) {
      throw new Error('[Profile.openFormOfPaymentTab] "page" is required.');
    }

    logger.debug("[Profile.openFormOfPaymentTab] Clicking Form of Payment tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickFormOfPaymentTab();
      await profilePage.waitForFopSection();
    } catch (err) {
      throw new Error(
        `[Profile.openFormOfPaymentTab] Failed to open Form of Payment tab: ${err.message}`
      );
    }

    logger.info("[Profile.openFormOfPaymentTab] Form of Payment tab opened");
  },

  /**
   * Adds a new credit card to the profile with the specified details.
   */
  async addCreditCard(page, { city, cardholder, cardNumber = '4580458045804580', cardAlias = 'Test Card', cardType = 'Visa', expiryMonth = '12', expiryYear = '2029', address = '123 Test St', zipCode = '10001', country = 'UNITED STATES (US)', state = 'New York' } = {}) {
    if (!page) {
      throw new Error('[Profile.addCreditCard] "page" is required.');
    }
    if (!city || typeof city !== 'string') {
      throw new Error(
        `[Profile.addCreditCard] "city" must be a non-empty string, got: ${typeof city} (${JSON.stringify(city)})`
      );
    }
    if (!cardholder || typeof cardholder !== 'string') {
      throw new Error(
        `[Profile.addCreditCard] "cardholder" must be a non-empty string, got: ${typeof cardholder} (${JSON.stringify(cardholder)})`
      );
    }

    logger.debug(`[Profile.addCreditCard] Adding card with city="${city}", cardholder="${cardholder}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickAddNewCard();
      await profilePage.waitForFopForm();
    } catch (err) {
      throw new Error(`[Profile.addCreditCard] Failed to open add card form: ${err.message}`);
    }

    try {
      await profilePage.fillCardDisplayName(cardAlias);
      await profilePage.selectCardType(cardType);
      await profilePage.fillCardHolderName(cardholder);
      await profilePage.insertCardNumber(cardNumber);
      await profilePage.selectExpiryMonth(expiryMonth);
      await profilePage.selectExpiryYear(expiryYear);
      await profilePage.fillBillingAddress(address);
      await profilePage.fillBillingCity(city);
      await profilePage.fillBillingZipCode(zipCode);
      await profilePage.selectBillingCountry(country);
      await profilePage.selectBillingState(state);
    } catch (err) {
      throw new Error(`[Profile.addCreditCard] Failed to fill card details: ${err.message}`);
    }

    try {
      await profilePage.clickSaveFop();
    } catch (err) {
      throw new Error(`[Profile.addCreditCard] Failed to save credit card: ${err.message}`);
    }

    logger.info(`[Profile.addCreditCard] Credit card added with city="${city}", cardholder="${cardholder}"`);
  },

  /**
   * Verifies the card holder name is displayed in the card preview list.
   */
  async verifyCardHolderName(page, expectedName) {
    if (!page) {
      throw new Error('[Profile.verifyCardHolderName] "page" is required.');
    }
    if (!expectedName || typeof expectedName !== 'string') {
      throw new Error(
        `[Profile.verifyCardHolderName] "expectedName" must be a non-empty string, got: ${typeof expectedName} (${JSON.stringify(expectedName)})`
      );
    }

    logger.debug(`[Profile.verifyCardHolderName] Verifying card holder name "${expectedName}" is displayed`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualName;
    try {
      actualName = await profilePage.getCardHolderNameFromPreview();
    } catch (err) {
      throw new Error(
        `[Profile.verifyCardHolderName] Failed to read card holder name from preview: ${err.message}`
      );
    }

    if (!actualName.toLowerCase().includes(expectedName.toLowerCase())) {
      throw new Error(
        `[Profile.verifyCardHolderName] Card holder name "${actualName}" does not contain expected "${expectedName}". ` +
        `The card may not have been saved successfully or a different card is shown.`
      );
    }

    logger.info(`[Profile.verifyCardHolderName] Card holder name "${actualName}" matches expected "${expectedName}"`);
  },

  /**
   * Deletes the last credit card from the profile (clicks actions → delete → confirm).
   */
  async deleteCreditCard(page) {
    if (!page) {
      throw new Error('[Profile.deleteCreditCard] "page" is required.');
    }

    logger.debug("[Profile.deleteCreditCard] Deleting last credit card from profile");

    const profilePage = getPageObject(page, ProfilePage);

    const countBefore = await profilePage.getCardPreviewCount();

    try {
      await profilePage.clickDeleteOnLastCard();
      await profilePage.confirmRemoveFopCard();
    } catch (err) {
      throw new Error(`[Profile.deleteCreditCard] Failed to delete credit card: ${err.message}`);
    }

    logger.info(`[Profile.deleteCreditCard] Credit card deleted (was ${countBefore} cards)`);
    return { countBefore };
  },

  /**
   * Removes every existing credit card so the test starts from a clean state.
   * Leftover cards accumulate across runs, so this deletes the last card
   * repeatedly until none remain.
   */
  async deleteAllCreditCards(page) {
    if (!page) {
      throw new Error('[Profile.deleteAllCreditCards] "page" is required.');
    }

    const profilePage = getPageObject(page, ProfilePage);

    let remaining = await profilePage.getCardPreviewCount();
    const initialCount = remaining;
    logger.debug(`[Profile.deleteAllCreditCards] Found ${remaining} existing card(s) to remove`);

    let attempts = 0;
    while (remaining > 0) {
      // safety cap — a real profile never holds this many cards
      if (attempts++ >= 20) {
        throw new Error(
          `[Profile.deleteAllCreditCards] Aborting after ${attempts} attempts — ${remaining} card(s) still present. ` +
          `A card is not deleting correctly.`
        );
      }

      try {
        await profilePage.clickDeleteOnLastCard();
        await profilePage.confirmRemoveFopCard();
      } catch (err) {
        throw new Error(`[Profile.deleteAllCreditCards] Failed to delete a card: ${err.message}`);
      }

      remaining = await profilePage.getCardPreviewCount();
    }

    logger.info("[Profile.deleteAllCreditCards] All existing credit cards removed — profile is clean");
    return { removed: initialCount };
  },

  /**
   * Verifies the credit card was removed (card count decreased or is zero).
   */
  async verifyCreditCardRemoved(page, countBefore) {
    if (!page) {
      throw new Error('[Profile.verifyCreditCardRemoved] "page" is required.');
    }

    logger.debug("[Profile.verifyCreditCardRemoved] Verifying card was removed");

    const profilePage = getPageObject(page, ProfilePage);

    const countAfter = await profilePage.getCardPreviewCount();

    if (countAfter >= (countBefore || 1)) {
      throw new Error(
        `[Profile.verifyCreditCardRemoved] Card was not removed — count before: ${countBefore}, count after: ${countAfter}. ` +
        `The delete operation may not have completed or the confirmation was not clicked.`
      );
    }

    logger.info(`[Profile.verifyCreditCardRemoved] Card removed (before: ${countBefore}, after: ${countAfter})`);
  },

  // --- Passports & Visas ---

  async navigateToPassportsFromTraveler(page) {
    if (!page) {
      throw new Error('[Profile.navigateToPassportsFromTraveler] "page" is required.');
    }

    logger.debug('[Profile.navigateToPassportsFromTraveler] Clicking traveler name and navigating to Passports & Visas tab');

    const profilePage = getPageObject(page, ProfilePage);
    const context = page.context();

    const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.clickFirstTravelerNameLink();
    } catch (err) {
      throw new Error(
        `[Profile.navigateToPassportsFromTraveler] Could not click traveler name link: ${err.message}`
      );
    }

    const newProfilePage = await newPagePromise;
    let targetPage = page;

    if (newProfilePage) {
      logger.info('[Profile.navigateToPassportsFromTraveler] Profile opened in a new tab');
      await newProfilePage.waitForLoadState('domcontentloaded', { timeout: 30000 });
      targetPage = newProfilePage;
    } else {
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    }

    const targetProfilePage = getPageObject(targetPage, ProfilePage);
    await targetProfilePage.waitForPersonalDetailsForm();
    await targetProfilePage.clickPassportsVisasTab();
    await targetProfilePage.waitForPassportVisaForm();

    logger.info('[Profile.navigateToPassportsFromTraveler] Passports & Visas tab is open');
    return targetPage;
  },

  async addVisa(page, { number, expiryYearsAhead = 3, country = 'United States' } = {}) {
    if (!page) {
      throw new Error('[Profile.addVisa] "page" is required.');
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Profile.addVisa] "number" must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }
    if (!Number.isInteger(expiryYearsAhead) || expiryYearsAhead < 1) {
      throw new Error(
        `[Profile.addVisa] "expiryYearsAhead" must be a positive integer, got: ${expiryYearsAhead}`
      );
    }

    logger.debug(`[Profile.addVisa] Adding visa with number "${number}", expiry ${expiryYearsAhead} years ahead`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.ensurePassportExists();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to ensure a passport entry exists: ${err.message}`);
    }

    try {
      await profilePage.clickAddVisa();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to click "Add new visa": ${err.message}`);
    }

    try {
      await profilePage.selectVisaCountry(country);
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to select visa country "${country}": ${err.message}`);
    }

    try {
      await profilePage.openVisaDatePicker();
      await profilePage.clickNextYearArrow(expiryYearsAhead);
      await profilePage.selectFirstAvailableDay();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to set visa expiry date (${expiryYearsAhead} years ahead): ${err.message}`);
    }

    try {
      await profilePage.fillVisaNumber(number);
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to fill visa number "${number}": ${err.message}`);
    }

    try {
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to save passport & visa form: ${err.message}`);
    }

    logger.info(`[Profile.addVisa] Visa added with number "${number}"`);
  },

  async deleteVisa(page) {
    if (!page) {
      throw new Error('[Profile.deleteVisa] "page" is required.');
    }

    logger.debug('[Profile.deleteVisa] Removing last visa entry');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickRemoveVisa();
    } catch (err) {
      throw new Error(`[Profile.deleteVisa] Failed to click remove on visa: ${err.message}`);
    }

    try {
      await profilePage.confirmRemovePassportVisa();
    } catch (err) {
      throw new Error(`[Profile.deleteVisa] Failed to confirm visa removal: ${err.message}`);
    }

    try {
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.deleteVisa] Failed to save after visa removal: ${err.message}`);
    }

    logger.info('[Profile.deleteVisa] Visa removed and form saved');
  },

  async openPassportsAndVisasTab(page) {
    if (!page) throw new Error('[Profile.openPassportsAndVisasTab] "page" is required.');

    logger.debug('[Profile.openPassportsAndVisasTab] Clicking Passports & Visas tab');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPassportsVisasTab();
      await profilePage.waitForPassportVisaForm();
    } catch (err) {
      throw new Error(`[Profile.openPassportsAndVisasTab] Failed to open Passports & Visas tab: ${err.message}`);
    }

    logger.info('[Profile.openPassportsAndVisasTab] Passports & Visas tab opened');
  },

  async enterKnownTravelerNumber(page, value) {
    if (!page) throw new Error('[Profile.enterKnownTravelerNumber] "page" is required.');
    if (!value || typeof value !== 'string') {
      throw new Error(
        `[Profile.enterKnownTravelerNumber] "value" must be a non-empty string, got: ${typeof value} (${JSON.stringify(value)})`
      );
    }

    logger.debug(`[Profile.enterKnownTravelerNumber] Filling known traveler number "${value}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.fillKnownTravelerNumber(value);
    } catch (err) {
      throw new Error(`[Profile.enterKnownTravelerNumber] Failed to enter known traveler number "${value}": ${err.message}`);
    }

    return { knownTravelerNumber: value };
  },

  async verifyKnownTravelerNumberSaved(page, expectedValue) {
    if (!page) throw new Error('[Profile.verifyKnownTravelerNumberSaved] "page" is required.');
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyKnownTravelerNumberSaved] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyKnownTravelerNumberSaved] Reloading profile to verify saved value "${expectedValue}"`);

    try {
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      throw new Error(`[Profile.verifyKnownTravelerNumberSaved] Page reload failed: ${err.message}`);
    }

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPassportsVisasTab();
      await profilePage.waitForPassportVisaForm();
    } catch (err) {
      throw new Error(`[Profile.verifyKnownTravelerNumberSaved] Failed to reopen Passports & Visas tab after reload: ${err.message}`);
    }

    let actualValue;
    try {
      actualValue = await profilePage.getKnownTravelerNumberValue();
    } catch (err) {
      throw new Error(`[Profile.verifyKnownTravelerNumberSaved] Failed to read known traveler number after reload: ${err.message}`);
    }

    if (actualValue !== expectedValue) {
      throw new Error(
        `[Profile.verifyKnownTravelerNumberSaved] Known traveler number was NOT saved correctly. ` +
        `Expected: "${expectedValue}", Actual: "${actualValue}". ` +
        `The save may have not persisted the value or the wrong field was typed into.`
      );
    }

    logger.info(`[Profile.verifyKnownTravelerNumberSaved] Known traveler number "${actualValue}" confirmed saved`);
    return { savedValue: actualValue };
  },

  async resetKnownTravelerNumber(page) {
    if (!page) throw new Error('[Profile.resetKnownTravelerNumber] "page" is required.');

    logger.debug('[Profile.resetKnownTravelerNumber] Clearing known traveler number and saving');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clearKnownTravelerNumber();
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.resetKnownTravelerNumber] Failed to reset known traveler number: ${err.message}`);
    }

    logger.info('[Profile.resetKnownTravelerNumber] Known traveler number reset to empty and saved');
    return { savedValue: '' };
  },

  async savePassportsAndVisasChanges(page) {
    if (!page) throw new Error('[Profile.savePassportsAndVisasChanges] "page" is required.');

    logger.debug('[Profile.savePassportsAndVisasChanges] Clicking Save on Passports & Visas form');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.savePassportsAndVisasChanges] Failed to save Passports & Visas form: ${err.message}`);
    }

    logger.info('[Profile.savePassportsAndVisasChanges] Passports & Visas changes saved');
  },

  async savePersonalDetails(page) {
    if (!page) throw new Error('[Profile.savePersonalDetails] "page" is required.');

    logger.debug('[Profile.savePersonalDetails] Clicking Save on Personal Details form');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSavePersonalDetails();
    } catch (err) {
      throw new Error(`[Profile.savePersonalDetails] Failed to save Personal Details: ${err.message}`);
    }

    logger.info('[Profile.savePersonalDetails] Personal Details saved');
  },

  async addBackupApprover(page, searchTerm) {
    if (!page) throw new Error('[Profile.addBackupApprover] "page" is required.');
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new Error(
        `[Profile.addBackupApprover] "searchTerm" must be a non-empty string, got: ${typeof searchTerm} (${JSON.stringify(searchTerm)})`
      );
    }

    logger.debug(`[Profile.addBackupApprover] Searching for backup approver with term "${searchTerm}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickBackupApproverDropdown();
      await profilePage.fillBackupApproverSearch(searchTerm);
      await profilePage.selectFirstDropdownOption();
    } catch (err) {
      throw new Error(`[Profile.addBackupApprover] Failed to add backup approver by searching "${searchTerm}": ${err.message}`);
    }

    logger.info(`[Profile.addBackupApprover] Backup approver selected with search term "${searchTerm}"`);
  },

  async removeBackupApprover(page) {
    if (!page) throw new Error('[Profile.removeBackupApprover] "page" is required.');

    logger.debug('[Profile.removeBackupApprover] Clearing backup approver selection');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clearBackupApprover();
    } catch (err) {
      throw new Error(`[Profile.removeBackupApprover] Failed to remove backup approver: ${err.message}`);
    }

    logger.info('[Profile.removeBackupApprover] Backup approver removed');
  },

  async verifyBackupApproverContains(page, text) {
    if (!page) throw new Error('[Profile.verifyBackupApproverContains] "page" is required.');
    if (!text || typeof text !== 'string') {
      throw new Error(
        `[Profile.verifyBackupApproverContains] "text" must be a non-empty string, got: ${typeof text} (${JSON.stringify(text)})`
      );
    }

    logger.debug(`[Profile.verifyBackupApproverContains] Checking backup approver field contains "${text}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getBackupApproverText();
    } catch (err) {
      throw new Error(`[Profile.verifyBackupApproverContains] Failed to read backup approver text: ${err.message}`);
    }

    if (!actualText || !actualText.toUpperCase().includes(text.toUpperCase())) {
      throw new Error(
        `[Profile.verifyBackupApproverContains] Backup approver field does not contain "${text}". ` +
        `Actual value: "${actualText}". The selection may not have been applied.`
      );
    }

    logger.info(`[Profile.verifyBackupApproverContains] Confirmed backup approver contains "${text}" (actual: "${actualText}")`);
    return { actualText };
  },

  async verifyBackupApproverPlaceholder(page, text) {
    if (!page) throw new Error('[Profile.verifyBackupApproverPlaceholder] "page" is required.');
    if (!text || typeof text !== 'string') {
      throw new Error(
        `[Profile.verifyBackupApproverPlaceholder] "text" must be a non-empty string, got: ${typeof text} (${JSON.stringify(text)})`
      );
    }

    logger.debug(`[Profile.verifyBackupApproverPlaceholder] Checking backup approver placeholder is "${text}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getBackupApproverText();
    } catch (err) {
      throw new Error(`[Profile.verifyBackupApproverPlaceholder] Failed to read backup approver text: ${err.message}`);
    }

    if (actualText !== text) {
      throw new Error(
        `[Profile.verifyBackupApproverPlaceholder] Backup approver field shows "${actualText}" but expected "${text}". ` +
        `The approver may not have been properly removed.`
      );
    }

    logger.info(`[Profile.verifyBackupApproverPlaceholder] Confirmed backup approver shows "${text}"`);
  },

  /**
   * Opens the traveler profile by clicking the first traveler name link on the trip page.
   * The profile opens in a new tab; this method returns the new page handle.
   */
  async openTravelerProfileFromName(page) {
    if (!page) throw new Error('[Profile.openTravelerProfileFromName] "page" is required.');

    logger.debug('[Profile.openTravelerProfileFromName] Clicking first traveler name link');

    const profilePage = getPageObject(page, ProfilePage);

    let newPage;
    try {
      const context = page.context();
      const [newTab] = await Promise.all([
        context.waitForEvent('page', { timeout: 15000 }),
        profilePage.clickFirstTravelerNameLink(),
      ]);
      newPage = newTab;
      await newPage.waitForLoadState('domcontentloaded', { timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[Profile.openTravelerProfileFromName] Failed to open traveler profile in new tab. ` +
        `The traveler name link may not be visible or no traveler was added to the trip. Original: ${err.message}`
      );
    }

    const newProfilePage = getPageObject(newPage, ProfilePage);

    try {
      await newProfilePage.waitForPersonalDetailsForm();
    } catch (err) {
      throw new Error(
        `[Profile.openTravelerProfileFromName] Traveler profile tab opened but personal details form did not load: ${err.message}`
      );
    }

    logger.info('[Profile.openTravelerProfileFromName] Traveler profile opened in new tab');
    return newPage;
  },

  /**
   * Navigates to the Travel Preferences tab on the traveler profile page.
   */
  async openTravelPreferencesTab(page) {
    if (!page) throw new Error('[Profile.openTravelPreferencesTab] "page" is required.');

    logger.debug('[Profile.openTravelPreferencesTab] Clicking Travel Preferences tab');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickTravelPreferencesTab();
      await profilePage.waitForTravelPreferencesForm();
    } catch (err) {
      throw new Error(`[Profile.openTravelPreferencesTab] Failed to open Travel Preferences tab: ${err.message}`);
    }

    logger.info('[Profile.openTravelPreferencesTab] Travel Preferences tab opened');
  },

  /**
   * Selects the first available seat preference (Aisle) from the seat type dropdown.
   */
  async selectSeatPreference(page) {
    if (!page) throw new Error('[Profile.selectSeatPreference] "page" is required.');

    logger.debug('[Profile.selectSeatPreference] Selecting seat preference from dropdown');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSeatPreferenceDropdown();
      // Select "Aisle" — the first meaningful option (index 0 in the options array)
      await profilePage.selectSeatPreferenceOption('Aisle');
    } catch (err) {
      throw new Error(
        `[Profile.selectSeatPreference] Failed to select seat preference: ${err.message}`
      );
    }

    logger.info('[Profile.selectSeatPreference] Seat preference "Aisle" selected');
  },

  /**
   * Clicks the Save button on the Travel Preferences form and waits for the save to complete.
   */
  async saveTravelPreferences(page) {
    if (!page) throw new Error('[Profile.saveTravelPreferences] "page" is required.');

    logger.debug('[Profile.saveTravelPreferences] Clicking Save on Travel Preferences form');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSaveTravelPreferences();
    } catch (err) {
      throw new Error(
        `[Profile.saveTravelPreferences] Failed to save travel preferences: ${err.message}`
      );
    }

    logger.info('[Profile.saveTravelPreferences] Travel preferences saved');
  },

  /**
   * Verifies that the seat preference is saved (text is not the default "No preference" placeholder).
   */
  async verifySeatPreferenceSaved(page) {
    if (!page) throw new Error('[Profile.verifySeatPreferenceSaved] "page" is required.');

    logger.debug('[Profile.verifySeatPreferenceSaved] Verifying seat preference is saved');

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getSeatPreferenceText();
    } catch (err) {
      throw new Error(`[Profile.verifySeatPreferenceSaved] Failed to read seat preference text: ${err.message}`);
    }

    if (!actualText || actualText === 'No preference') {
      throw new Error(
        `[Profile.verifySeatPreferenceSaved] Seat preference was NOT saved — field still shows "${actualText || 'empty'}". ` +
        `The selection may not have been applied or the save did not persist the value.`
      );
    }

    logger.info(`[Profile.verifySeatPreferenceSaved] Seat preference is saved: "${actualText}"`);
    return { seatPreference: actualText };
  },

  /**
   * Clears the seat preference by opening the dropdown and selecting "No preference".
   */
  async clearSeatPreference(page) {
    if (!page) throw new Error('[Profile.clearSeatPreference] "page" is required.');

    logger.debug('[Profile.clearSeatPreference] Clearing seat preference by selecting "No preference"');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSeatPreferenceDropdown();
      await profilePage.selectSeatPreferenceOption('No preference');
    } catch (err) {
      throw new Error(
        `[Profile.clearSeatPreference] Failed to clear seat preference — could not select "No preference": ${err.message}`
      );
    }

    logger.info('[Profile.clearSeatPreference] Seat preference cleared (set to "No preference")');
  },

  /**
   * Verifies that the seat preference shows the default "No preference" placeholder (i.e., is cleared).
   */
  async verifySeatPreferenceCleared(page) {
    if (!page) throw new Error('[Profile.verifySeatPreferenceCleared] "page" is required.');

    logger.debug('[Profile.verifySeatPreferenceCleared] Verifying seat preference is cleared');

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getSeatPreferenceText();
    } catch (err) {
      throw new Error(`[Profile.verifySeatPreferenceCleared] Failed to read seat preference text: ${err.message}`);
    }

    if (actualText !== 'No preference') {
      throw new Error(
        `[Profile.verifySeatPreferenceCleared] Seat preference was NOT cleared — field shows "${actualText}" but expected "No preference". ` +
        `The "No preference" option may not have been selected or the save did not persist the change.`
      );
    }

    logger.info('[Profile.verifySeatPreferenceCleared] Seat preference confirmed cleared ("No preference")');
  },

  /**
   * Verifies no validation warning messages are visible in the dynamic reference fields section of the profile.
   */
  async verifyNoDynamicFieldWarnings(page) {
    if (!page) throw new Error('[Profile.verifyNoDynamicFieldWarnings] "page" is required.');

    logger.debug('[Profile.verifyNoDynamicFieldWarnings] Waiting for personal details form before checking warnings');

    try {
      await page.locator('.personal-details-form-content').waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[Profile.verifyNoDynamicFieldWarnings] Personal details form did not become visible — cannot check for dynamic field warnings. ` +
        `Original: ${err.message}`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    let warningCount;

    try {
      warningCount = await profilePage.getDynamicFieldWarningCount();
    } catch (err) {
      throw new Error(
        `[Profile.verifyNoDynamicFieldWarnings] Failed to count dynamic field warnings: ${err.message}`
      );
    }

    if (warningCount > 0) {
      throw new Error(
        `[Profile.verifyNoDynamicFieldWarnings] Expected no dynamic field warning messages but found ${warningCount}. ` +
        `This means a required dynamic reference field may not be filled in the traveler profile. ` +
        `Check the profile data for the test user.`
      );
    }

    logger.info('[Profile.verifyNoDynamicFieldWarnings] No dynamic field warning messages are visible');
  },

  /**
   * Verifies the selected value of the dynamic profile dropdown field matches the expected value.
   */
  async verifyDynamicFieldValue(page, expectedValue) {
    if (!page) throw new Error('[Profile.verifyDynamicFieldValue] "page" is required.');
    if (typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyDynamicFieldValue] "expectedValue" must be a string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyDynamicFieldValue] Verifying dynamic reference field shows "${expectedValue}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let actualValue;

    try {
      actualValue = await profilePage.getDynamicFieldSelectValue();
    } catch (err) {
      throw new Error(`[Profile.verifyDynamicFieldValue] Failed to read dynamic field value: ${err.message}`);
    }

    const trimmed = (actualValue || '').trim();
    if (trimmed !== expectedValue) {
      throw new Error(
        `[Profile.verifyDynamicFieldValue] Dynamic profile field shows "${trimmed}" but expected "${expectedValue}". ` +
        `The field may have a different value saved in the profile, or the locator is reading the placeholder instead of the selected value.`
      );
    }

    logger.info(`[Profile.verifyDynamicFieldValue] Dynamic profile field confirmed showing "${trimmed}"`);
    return { dynamicFieldValue: trimmed };
  },

  /**
   * Verifies the Personal Details tab is the active tab by checking the "Title" field label is visible.
   */
  async verifyPersonalDetailsTabActive(page, expectedLabel = 'Title') {
    if (!page) throw new Error('[Profile.verifyPersonalDetailsTabActive] "page" is required.');
    if (typeof expectedLabel !== 'string' || !expectedLabel) {
      throw new Error(
        `[Profile.verifyPersonalDetailsTabActive] "expectedLabel" must be a non-empty string, got: ${typeof expectedLabel} (${JSON.stringify(expectedLabel)})`
      );
    }

    logger.debug(`[Profile.verifyPersonalDetailsTabActive] Verifying Personal Details tab is active — expecting field label "${expectedLabel}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let label;

    try {
      label = await profilePage.getTitleFieldLabel();
    } catch (err) {
      throw new Error(
        `[Profile.verifyPersonalDetailsTabActive] Failed to read the first field label from the Personal Details form: ${err.message}. ` +
        `The Personal Details tab may not be the active tab when the profile opens.`
      );
    }

    if (!label.includes(expectedLabel)) {
      throw new Error(
        `[Profile.verifyPersonalDetailsTabActive] Expected the first label in name-inputs-container to contain "${expectedLabel}" but got "${label}". ` +
        `The Personal Details tab may not be open or the form layout has changed.`
      );
    }

    logger.info(`[Profile.verifyPersonalDetailsTabActive] Personal Details tab confirmed active — field label "${label}" contains "${expectedLabel}"`);
    return { label };
  },

  async openPersonalDetailsTab(page) {
    if (!page) throw new Error('[Profile.openPersonalDetailsTab] "page" is required.');
    logger.debug('[Profile.openPersonalDetailsTab] Clicking Personal Details tab');
    const profilePage = getPageObject(page, ProfilePage);
    try {
      await profilePage.clickPersonalDetailsTab();
      await profilePage.waitForPersonalDetailsForm();
    } catch (err) {
      throw new Error(`[Profile.openPersonalDetailsTab] Failed to open Personal Details tab: ${err.message}`);
    }
    logger.info('[Profile.openPersonalDetailsTab] Personal Details tab opened');
  },

  async scrollToDynamicFields(page) {
    if (!page) throw new Error('[Profile.scrollToDynamicFields] "page" is required.');
    logger.debug('[Profile.scrollToDynamicFields] Scrolling to dynamic reference fields section');
    const profilePage = getPageObject(page, ProfilePage);
    try {
      await profilePage.scrollToDynamicFieldLabel();
    } catch (err) {
      throw new Error(`[Profile.scrollToDynamicFields] Failed to scroll to dynamic reference fields: ${err.message}`);
    }
    logger.info('[Profile.scrollToDynamicFields] Scrolled to dynamic reference fields section');
  },

  async hoverDynamicFieldIcon(page) {
    if (!page) throw new Error('[Profile.hoverDynamicFieldIcon] "page" is required.');
    logger.debug('[Profile.hoverDynamicFieldIcon] Hovering over dynamic field info icon');
    const profilePage = getPageObject(page, ProfilePage);
    try {
      await profilePage.hoverDynamicFieldInfoIcon();
    } catch (err) {
      throw new Error(`[Profile.hoverDynamicFieldIcon] Failed to hover over dynamic field info icon: ${err.message}`);
    }
    logger.info('[Profile.hoverDynamicFieldIcon] Hovered over dynamic field info icon');
  },

  async verifyTooltipText(page, expectedText) {
    if (!page) throw new Error('[Profile.verifyTooltipText] "page" is required.');
    if (typeof expectedText !== 'string') {
      throw new Error(
        `[Profile.verifyTooltipText] "expectedText" must be a string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }
    logger.debug(`[Profile.verifyTooltipText] Verifying tooltip displays "${expectedText}"`);
    const profilePage = getPageObject(page, ProfilePage);
    let actualText;
    try {
      actualText = await profilePage.getDynamicFieldTooltipText();
    } catch (err) {
      throw new Error(`[Profile.verifyTooltipText] Failed to read tooltip text: ${err.message}`);
    }
    const trimmed = (actualText || '').trim();
    if (trimmed !== expectedText) {
      throw new Error(
        `[Profile.verifyTooltipText] Tooltip shows "${trimmed}" but expected "${expectedText}". ` +
        `The tooltip may not have appeared, or the dynamic field helpQuestionText is different from expected.`
      );
    }
    logger.info(`[Profile.verifyTooltipText] Tooltip text confirmed: "${trimmed}"`);
    return { tooltipText: trimmed };
  },

  async verifyLoyaltyNumbersMasked(page) {
    if (!page) throw new Error('[Profile.verifyLoyaltyNumbersMasked] "page" is required.');
    logger.debug('[Profile.verifyLoyaltyNumbersMasked] Reading all loyalty number input values');
    const profilePage = getPageObject(page, ProfilePage);
    let values;
    try {
      values = await profilePage.getAllLoyaltyInputValues();
    } catch (err) {
      throw new Error(`[Profile.verifyLoyaltyNumbersMasked] Failed to read loyalty inputs: ${err.message}`);
    }
    if (values.length === 0) {
      throw new Error(
        '[Profile.verifyLoyaltyNumbersMasked] No loyalty number inputs found in the frequent programs form. ' +
        'Ensure the traveler has loyalty numbers and the Frequent Programs tab is open.'
      );
    }
    const maskedValues = values.filter(v => /^\*{9}.{3}$/.test(v));
    if (maskedValues.length === 0) {
      throw new Error(
        `[Profile.verifyLoyaltyNumbersMasked] None of the ${values.length} input(s) are masked with the expected format. ` +
        `Values found: ${JSON.stringify(values)}. Expected format: *********XXX. ` +
        `Ensure the logged-in user has "Can view profile of other users" privilege to trigger masking.`
      );
    }
    logger.info(`[Profile.verifyLoyaltyNumbersMasked] ${maskedValues.length}/${values.length} loyalty numbers confirmed masked`);
    return { maskedCount: maskedValues.length, totalCount: values.length };
  },

  async verifyMaskedLoyaltyEnding(page, lastDigits) {
    if (!page) throw new Error('[Profile.verifyMaskedLoyaltyEnding] "page" is required.');
    if (typeof lastDigits !== 'string' || !lastDigits) {
      throw new Error(
        `[Profile.verifyMaskedLoyaltyEnding] "lastDigits" must be a non-empty string, got: ${typeof lastDigits} (${JSON.stringify(lastDigits)})`
      );
    }
    logger.debug(`[Profile.verifyMaskedLoyaltyEnding] Looking for masked loyalty number ending in "${lastDigits}"`);
    const profilePage = getPageObject(page, ProfilePage);
    let values;
    try {
      values = await profilePage.getAllLoyaltyInputValues();
    } catch (err) {
      throw new Error(`[Profile.verifyMaskedLoyaltyEnding] Failed to read loyalty inputs: ${err.message}`);
    }
    const match = values.find(v => v.endsWith(lastDigits));
    if (!match) {
      throw new Error(
        `[Profile.verifyMaskedLoyaltyEnding] No loyalty number ending in "${lastDigits}" found. ` +
        `Values present: ${JSON.stringify(values)}. ` +
        `Expected a masked entry matching "*********${lastDigits}". Verify the traveler's loyalty data in their profile.`
      );
    }
    logger.info(`[Profile.verifyMaskedLoyaltyEnding] Found masked loyalty number ending in "${lastDigits}": "${match}"`);
    return { matchedValue: match };
  },

  /**
   * Adds a credit card using name (alias), type, number, expiry month and year only.
   * Does not require billing address fields (uses defaults for non-mandatory fields).
   * Call openFormOfPaymentTab first.
   */
  async addCreditCardFull(page, { name, type, number, expiryMonth, expiryYear } = {}) {
    if (!page) {
      throw new Error('[Profile.addCreditCardFull] "page" is required.');
    }
    if (!name || typeof name !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "name" (card alias) must be a non-empty string, got: ${typeof name} (${JSON.stringify(name)})`
      );
    }
    if (!type || typeof type !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "type" (card type e.g. "visa") must be a non-empty string, got: ${typeof type} (${JSON.stringify(type)})`
      );
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "number" (card number) must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }
    if (!expiryMonth || typeof expiryMonth !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "expiryMonth" must be a non-empty string (e.g. "02"), got: ${typeof expiryMonth} (${JSON.stringify(expiryMonth)})`
      );
    }
    if (!expiryYear || typeof expiryYear !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "expiryYear" must be a non-empty string (e.g. "2032"), got: ${typeof expiryYear} (${JSON.stringify(expiryYear)})`
      );
    }

    logger.debug(`[Profile.addCreditCardFull] Adding card with name="${name}", type="${type}", expiry=${expiryMonth}/${expiryYear}`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickAddNewCard();
      await profilePage.waitForFopForm();
    } catch (err) {
      throw new Error(`[Profile.addCreditCardFull] Failed to open add-card form: ${err.message}`);
    }

    try {
      await profilePage.fillCardDisplayName(name);
      await profilePage.selectCardType(type);
      await profilePage.fillCardHolderName(name);
      await profilePage.insertCardNumber(number);
      await profilePage.selectExpiryMonth(expiryMonth);
      await profilePage.selectExpiryYear(expiryYear);
      await profilePage.fillBillingAddress('123 Main Street');
      await profilePage.fillBillingCity('London');
      // The zip/postcode field only accepts numeric input.
      await profilePage.fillBillingZipCode('12345');
      // Use United Kingdom rather than United States: a US billing country makes the
      // State field mandatory, and this form does not populate it, so the card silently
      // fails validation and never saves. The UK has no mandatory state/province field.
      await profilePage.selectBillingCountry('UNITED KINGDOM (GB)');
    } catch (err) {
      throw new Error(`[Profile.addCreditCardFull] Failed to fill card details for "${name}": ${err.message}`);
    }

    try {
      await profilePage.clickSaveFop();
    } catch (err) {
      throw new Error(`[Profile.addCreditCardFull] Failed to save credit card "${name}": ${err.message}`);
    }

    logger.info(`[Profile.addCreditCardFull] Credit card "${name}" saved successfully`);
  },

  /**
   * Verifies the card display name (alias) shown in the profile FOP card preview.
   * Checks the .card-name element, which differs from the cardholder name (.card-holder-name).
   */
  async verifyCardName(page, cardName) {
    if (!page) {
      throw new Error('[Profile.verifyCardName] "page" is required.');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error(
        `[Profile.verifyCardName] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`
      );
    }

    logger.debug(`[Profile.verifyCardName] Verifying card display name "${cardName}" is shown in FOP preview`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualName;
    try {
      actualName = await profilePage.getCardNameFromPreview();
    } catch (err) {
      throw new Error(
        `[Profile.verifyCardName] Failed to read card display name from FOP preview: ${err.message}`
      );
    }

    if (!actualName.toLowerCase().includes(cardName.toLowerCase())) {
      throw new Error(
        `[Profile.verifyCardName] Card display name "${actualName}" does not contain expected "${cardName}". ` +
        `The card may not have been saved correctly or the alias did not persist.`
      );
    }

    logger.info(`[Profile.verifyCardName] Card display name "${actualName}" matches expected "${cardName}"`);
    return { actualName };
  },

  /**
   * Waits for the user-profile mandatory-field dialog popup to appear and verifies
   * that the specified field is marked as mandatory inside the popup.
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {string} fieldName - The field label text expected to carry the "mandatory" class (e.g. "Mobile")
   */
  async verifyMandatoryFieldPopup(page, fieldName) {
    if (!page) {
      throw new Error('[Profile.verifyMandatoryFieldPopup] "page" is required.');
    }
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${JSON.stringify(fieldName)})`
      );
    }

    logger.debug(`[Profile.verifyMandatoryFieldPopup] Waiting for profile popup and verifying "${fieldName}" is mandatory`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.waitForProfilePopup();
    } catch (err) {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] Profile mandatory-field popup did not appear: ${err.message}`
      );
    }

    let actualLabel;
    try {
      actualLabel = await profilePage.getMandatoryFieldLabel();
    } catch (err) {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] Could not read mandatory field label from popup: ${err.message}. ` +
        `The popup may be open but no field carries the CSS class "mandatory" — check that the mobile field is actually mandatory for this corporation.`
      );
    }

    if (!actualLabel.includes(fieldName)) {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] Mandatory field label "${actualLabel}" does not contain expected field "${fieldName}". ` +
        `The label class "mandatory" is applied conditionally by checkIsMandateField() — verify the corporation settings mark Mobile as mandatory.`
      );
    }

    logger.info(`[Profile.verifyMandatoryFieldPopup] Profile popup shows "${actualLabel}" as mandatory`);
    return { actualLabel };
  },

  /**
   * Clicks the "Save Contact Information" button in the profile popup to trigger validation.
   * Use this when the popup has empty mandatory fields and you want to see the validation messages.
   */
  async trySaveProfilePopup(page) {
    if (!page) {
      throw new Error('[Profile.trySaveProfilePopup] "page" is required.');
    }

    logger.debug('[Profile.trySaveProfilePopup] Clicking Save in profile popup to trigger validation');
    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSaveInPopup();
    } catch (err) {
      throw new Error(
        `[Profile.trySaveProfilePopup] Failed to click the Save button in the profile popup: ${err.message}. ` +
        `Ensure the profile popup is visible and the Save button is present.`
      );
    }

    logger.info('[Profile.trySaveProfilePopup] Save button clicked — validation messages should now appear');
  },

  /**
   * Verifies the validation message displayed inside the profile popup.
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {string} message - The expected validation message text (e.g. "Invalid phone number")
   */
  async verifyValidationMessage(page, message) {
    if (!page) {
      throw new Error('[Profile.verifyValidationMessage] "page" is required.');
    }
    if (!message || typeof message !== 'string') {
      throw new Error(
        `[Profile.verifyValidationMessage] "message" must be a non-empty string, got: ${typeof message} (${JSON.stringify(message)})`
      );
    }

    logger.debug(`[Profile.verifyValidationMessage] Verifying validation message contains "${message}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualMessage;
    try {
      actualMessage = await profilePage.getValidationMessage();
    } catch (err) {
      throw new Error(
        `[Profile.verifyValidationMessage] Could not read validation message from profile popup: ${err.message}. ` +
        `The message appears only when a phone input is touched and invalid — ensure the popup has been triggered by saving with empty mobile.`
      );
    }

    if (!actualMessage.includes(message)) {
      throw new Error(
        `[Profile.verifyValidationMessage] Validation message "${actualMessage}" does not contain expected text "${message}". ` +
        `Check the i18n key "validation.invalidPhone" for the correct translated value.`
      );
    }

    logger.info(`[Profile.verifyValidationMessage] Validation message verified: "${actualMessage}"`);
    return { actualMessage };
  },

  /**
   * Verifies the informational message displayed at the bottom of the profile popup
   * (the "please fill all required fields" message rendered when form is invalid on submit).
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {string} message - The expected info message text
   */
  async verifyInfoMessage(page, message) {
    if (!page) {
      throw new Error('[Profile.verifyInfoMessage] "page" is required.');
    }
    if (!message || typeof message !== 'string') {
      throw new Error(
        `[Profile.verifyInfoMessage] "message" must be a non-empty string, got: ${typeof message} (${JSON.stringify(message)})`
      );
    }

    logger.debug(`[Profile.verifyInfoMessage] Verifying info message contains "${message}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualMessage;
    try {
      actualMessage = await profilePage.getInfoMessage();
    } catch (err) {
      throw new Error(
        `[Profile.verifyInfoMessage] Could not read info message from profile popup: ${err.message}. ` +
        `The message appears only when markFields is true and the form is invalid — ensure the save was attempted before checking.`
      );
    }

    if (!actualMessage.includes(message)) {
      throw new Error(
        `[Profile.verifyInfoMessage] Info message "${actualMessage}" does not contain expected text "${message}". ` +
        `Check the i18n key "userProfile.pleaseFillRequiredFields" for the correct translated value.`
      );
    }

    logger.info(`[Profile.verifyInfoMessage] Info message verified: "${actualMessage}"`);
    return { actualMessage };
  },

  /**
   * Fills in the mobile phone number fields inside the profile mandatory-field popup
   * and clicks Save. The popup should already be open.
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {{ countryCode: string, areaCode: string, number: string }} options
   */
  async enterMobileInPopup(page, { countryCode, areaCode, number } = {}) {
    if (!page) {
      throw new Error('[Profile.enterMobileInPopup] "page" is required.');
    }
    if (!countryCode || typeof countryCode !== 'string') {
      throw new Error(
        `[Profile.enterMobileInPopup] "countryCode" must be a non-empty string, got: ${typeof countryCode} (${JSON.stringify(countryCode)})`
      );
    }
    if (!areaCode || typeof areaCode !== 'string') {
      throw new Error(
        `[Profile.enterMobileInPopup] "areaCode" must be a non-empty string, got: ${typeof areaCode} (${JSON.stringify(areaCode)})`
      );
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Profile.enterMobileInPopup] "number" must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }

    logger.debug(`[Profile.enterMobileInPopup] Filling mobile in popup: ${countryCode}-${areaCode}-${number}`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.fillMobileInPopup({ countryCode, areaCode, number });
    } catch (err) {
      throw new Error(
        `[Profile.enterMobileInPopup] Failed to fill mobile (${countryCode}-${areaCode}-${number}) in popup: ${err.message}`
      );
    }

    try {
      await profilePage.clickSaveInPopup();
    } catch (err) {
      throw new Error(
        `[Profile.enterMobileInPopup] Failed to click Save in popup after filling mobile: ${err.message}. ` +
        `The phone number may still be invalid — verify the format is correct for the configured validator.`
      );
    }

    logger.info(`[Profile.enterMobileInPopup] Mobile entered and saved in popup: ${countryCode}-${areaCode}-${number}`);
  },
};

module.exports = Profile;
