const { getPageObject } = require("@utils/pageObjectCache");
const AdministrationPage = require("@src/pages/AdministrationPage");
const LoginPage = require("@src/pages/LoginPage");
const logger = require("@utils/logger").child("Administration");

/**
 * Administration DSL
 *
 * High-level actions for the external AngularJS administration portal.
 * The admin portal is a separate application that opens in a new browser tab.
 */
const Administration = {
  /**
   * Navigates to the administration portal by clicking the admin settings icon in the OBT side nav.
   * The admin opens in a new browser tab; returns the new page instance.
   *
   * @param {import('playwright').Page} page - The current OBT page (profile or main app page)
   * @returns {import('playwright').Page} The administration page
   */
  async navigateToAdministration(page) {
    if (!page) {
      throw new Error('[Administration.navigateToAdministration] "page" is required.');
    }

    logger.debug('[Administration.navigateToAdministration] Clicking admin settings icon in side nav');

    const context = page.context();
    if (!context) {
      throw new Error('[Administration.navigateToAdministration] Page context is null — cannot detect new tab.');
    }

    const adminPage = getPageObject(page, AdministrationPage);

    // Dismiss cookie consent banner if present — it can intercept pointer events
    const loginPage = getPageObject(page, LoginPage);
    await loginPage.acceptCookiesIfPresent(5000);

    const newPagePromise = context.waitForEvent('page', { timeout: 20000 }).catch(() => null);

    try {
      await adminPage.clickAdminSettingsIcon();
    } catch (err) {
      throw new Error(
        `[Administration.navigateToAdministration] Failed to click admin settings icon: ${err.message}`
      );
    }

    const newAdminTab = await newPagePromise;

    if (!newAdminTab) {
      throw new Error(
        `[Administration.navigateToAdministration] Administration did not open in a new tab after clicking the settings icon. ` +
        `Ensure the logged-in user has administration access (isAccessAdministration or isLimitedAdmin must be true).`
      );
    }

    logger.info('[Administration.navigateToAdministration] Administration portal opened in a new tab');

    const adminPageInNewTab = getPageObject(newAdminTab, AdministrationPage);
    await adminPageInNewTab.waitForAdminPageReady();

    logger.info('[Administration.navigateToAdministration] Administration portal is ready');
    return newAdminTab;
  },

  /**
   * Searches for a user in the administration Users list and opens their record.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - The user's full name to search for (e.g. "Brunina tist")
   */
  async searchUserInAdmin(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.searchUserInAdmin] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.searchUserInAdmin] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.searchUserInAdmin] Searching for user "${userName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickUsersTab();
    } catch (err) {
      throw new Error(
        `[Administration.searchUserInAdmin] Failed to click Users tab before searching for "${userName}": ${err.message}`
      );
    }

    try {
      await page.fillUserSearch(userName);
    } catch (err) {
      throw new Error(
        `[Administration.searchUserInAdmin] Failed to type "${userName}" into user search: ${err.message}`
      );
    }

    try {
      await page.clickFirstUserRowWithName(userName);
    } catch (err) {
      throw new Error(
        `[Administration.searchUserInAdmin] Failed to click user row for "${userName}": ${err.message}. ` +
        `The search may have returned no results — verify the user exists in the administration.`
      );
    }

    logger.info(`[Administration.searchUserInAdmin] User "${userName}" record opened`);
  },

  /**
   * Opens the Form of Payment tab inside the administration user view.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openFopTabInAdmin(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openFopTabInAdmin] "adminPage" is required.');
    }

    logger.debug('[Administration.openFopTabInAdmin] Clicking Form of Payment tab in admin user view');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickFopTab();
    } catch (err) {
      throw new Error(
        `[Administration.openFopTabInAdmin] Failed to click Form of Payment tab in admin: ${err.message}. ` +
        `The user record must be open and have a Form of Payment tab.`
      );
    }

    logger.info('[Administration.openFopTabInAdmin] Form of Payment tab opened in administration');
  },

  /**
   * Verifies the expiry month and year of a credit card in the administration FOP view.
   * Clicks on the card row to open its edit form, then reads the Select2 dropdown values.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {{ cardName: string, month: string, year: string }} options
   */
  async verifyCcExpiryInAdmin(adminPage, { cardName, month, year } = {}) {
    if (!adminPage) {
      throw new Error('[Administration.verifyCcExpiryInAdmin] "adminPage" is required.');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`
      );
    }
    if (!month || typeof month !== 'string') {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] "month" must be a non-empty string (e.g. "2" or "02"), got: ${typeof month} (${JSON.stringify(month)})`
      );
    }
    if (!year || typeof year !== 'string') {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] "year" must be a non-empty string (e.g. "2032"), got: ${typeof year} (${JSON.stringify(year)})`
      );
    }

    logger.debug(`[Administration.verifyCcExpiryInAdmin] Verifying card "${cardName}" shows expiry ${month}/${year}`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickCreditCardRow(cardName);
    } catch (err) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Could not open card edit form for "${cardName}": ${err.message}`
      );
    }

    let actualMonth;
    try {
      actualMonth = await page.getExpiryMonth();
    } catch (err) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Could not read expiry month for card "${cardName}": ${err.message}`
      );
    }

    let actualYear;
    try {
      actualYear = await page.getExpiryYear();
    } catch (err) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Could not read expiry year for card "${cardName}": ${err.message}`
      );
    }

    // The admin displays month as a number without leading zero (e.g. "2" not "02")
    const normalizedExpectedMonth = String(parseInt(month, 10));

    if (actualMonth !== normalizedExpectedMonth) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Card "${cardName}" expiry month mismatch. ` +
        `Expected "${normalizedExpectedMonth}" (from input "${month}") but admin shows "${actualMonth}". ` +
        `This means the month set in the profile did not synchronise to administration correctly.`
      );
    }

    if (actualYear !== year) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Card "${cardName}" expiry year mismatch. ` +
        `Expected "${year}" but admin shows "${actualYear}". ` +
        `This means the year set in the profile did not synchronise to administration correctly.`
      );
    }

    logger.info(`[Administration.verifyCcExpiryInAdmin] Card "${cardName}" expiry verified: ${actualMonth}/${actualYear}`);
    return { actualMonth, actualYear };
  },

  /**
   * Deletes a credit card from the administration FOP view.
   * Clicks the delete image for the card and confirms the dialog.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} cardName - The display name of the card to delete
   */
  async deleteCcFromAdmin(adminPage, cardName) {
    if (!adminPage) {
      throw new Error('[Administration.deleteCcFromAdmin] "adminPage" is required.');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error(
        `[Administration.deleteCcFromAdmin] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`
      );
    }

    logger.debug(`[Administration.deleteCcFromAdmin] Deleting card "${cardName}" from administration`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickDeleteImageForCard(cardName);
    } catch (err) {
      throw new Error(
        `[Administration.deleteCcFromAdmin] Could not click delete image for card "${cardName}": ${err.message}`
      );
    }

    try {
      await page.confirmDeleteDialog();
    } catch (err) {
      throw new Error(
        `[Administration.deleteCcFromAdmin] Delete dialog did not appear or confirmation failed for card "${cardName}": ${err.message}`
      );
    }

    logger.info(`[Administration.deleteCcFromAdmin] Card "${cardName}" deleted from administration`);
  },

  /**
   * Searches for a user in the administration, opens their record, navigates to the
   * Contact Information tab, clears all mobile phone inputs, and saves the changes.
   * Used to set up a test scenario where mandatory mobile field is empty.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - Full name of the user to search for (e.g. "mendy tori")
   */
  async clearUserMobileInAdmin(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.clearUserMobileInAdmin] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.clearUserMobileInAdmin] Clearing mobile for user "${userName}"`);

    await Administration.searchUserInAdmin(adminPage, userName);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickContactInfoTab();
    } catch (err) {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] Failed to open Contact Information tab for user "${userName}": ${err.message}`
      );
    }

    try {
      await page.clearMobileInputsInAdmin();
    } catch (err) {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] Failed to clear mobile inputs for user "${userName}": ${err.message}`
      );
    }

    try {
      await page.saveContactInfoInAdmin();
    } catch (err) {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] Failed to save after clearing mobile for user "${userName}": ${err.message}`
      );
    }

    logger.info(`[Administration.clearUserMobileInAdmin] Mobile field cleared and saved for user "${userName}"`);
  },

  /**
   * Verifies the mobile phone values shown in the administration Contact Information tab.
   * Assumes the user record is already open (e.g. after searchUserInAdmin).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {{ countryCode: string, areaCode: string, number: string }} options
   */
  async verifyMobileInAdmin(adminPage, { countryCode, areaCode, number } = {}) {
    if (!adminPage) {
      throw new Error('[Administration.verifyMobileInAdmin] "adminPage" is required.');
    }
    if (!countryCode || typeof countryCode !== 'string') {
      throw new Error(
        `[Administration.verifyMobileInAdmin] "countryCode" must be a non-empty string, got: ${typeof countryCode} (${JSON.stringify(countryCode)})`
      );
    }
    if (!areaCode || typeof areaCode !== 'string') {
      throw new Error(
        `[Administration.verifyMobileInAdmin] "areaCode" must be a non-empty string, got: ${typeof areaCode} (${JSON.stringify(areaCode)})`
      );
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Administration.verifyMobileInAdmin] "number" must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }

    logger.debug(`[Administration.verifyMobileInAdmin] Verifying mobile ${countryCode}-${areaCode}-${number} in administration`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickContactInfoTab();
    } catch (err) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Failed to open Contact Information tab: ${err.message}`
      );
    }

    let actual;
    try {
      actual = await page.getAdminMobileValues();
    } catch (err) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Failed to read mobile values from admin: ${err.message}`
      );
    }

    if (actual.countryCode !== countryCode) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Mobile country code mismatch. ` +
        `Expected "${countryCode}" but admin shows "${actual.countryCode}". ` +
        `The value entered in the profile popup may not have synced to administration.`
      );
    }
    if (actual.areaCode !== areaCode) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Mobile area code mismatch. ` +
        `Expected "${areaCode}" but admin shows "${actual.areaCode}". ` +
        `The value entered in the profile popup may not have synced to administration.`
      );
    }
    if (actual.number !== number) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Mobile number mismatch. ` +
        `Expected "${number}" but admin shows "${actual.number}". ` +
        `The value entered in the profile popup may not have synced to administration.`
      );
    }

    logger.info(`[Administration.verifyMobileInAdmin] Mobile verified in admin: ${actual.countryCode}-${actual.areaCode}-${actual.number}`);
    return actual;
  },
};

module.exports = Administration;
