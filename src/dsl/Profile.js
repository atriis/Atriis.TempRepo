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
};

module.exports = Profile;
