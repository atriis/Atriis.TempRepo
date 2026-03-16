const { getPageObject } = require("@utils/pageObjectCache");
const DynamicAndReferenceFieldsPage = require("@pages/DynamicAndReferenceFieldsPage");
const { CommonPage } = require("@pages/CommonPage");
const { CheckoutPage } = require("@pages/CheckoutPage");
const { TravelRequestPage } = require("@pages/TravelRequestPage");

/**
 * DynamicAndReferenceFields DSL
 *
 * Exposes business-level actions for dynamic and reference fields.
 * - Explains intent
 * - Logs behavior
 * - Returns business-level results
 */
const DynamicAndReferenceFields = {
  /**
   * Selects "CONFERENCE" from the Trip Purpose reference field and proceeds.
   *
   * This flow:
   * - Opens the Trip Purpose dropdown
   * - Waits for and selects "CONFERENCE" option
   * - Waits for the Proceed button
   * - Clicks the Proceed button
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async selectTripPurposeReferenceField(page) {
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const commonPage = getPageObject(page, CommonPage);

    // Open the Trip Purpose dropdown
    await dynamicFieldsPage.clickToOpenDropdown("TRIP PURPOSE");

    // Wait for and select CONFERENCE option
    await dynamicFieldsPage.waitForDropdownOption("CONFERENCE");
    await dynamicFieldsPage.selectDropdownOption("CONFERENCE");

    // Wait for and click Proceed button
    await commonPage.getProceedButton().waitFor({ state: "visible" });
    await commonPage.clickProceedButton();
  },

  /**
   * Fills in a checkout number field with the value "11111".
   * Used for checkout workflows that require a reference or tracking number.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} [fieldIndex=5] - The index of the text field to fill (default is 5).
   * @returns {Promise<void>}
   */
  async addNumberCheckoutField(page, fieldIndex = 5) {
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Fill the text field with the checkout number
    await dynamicFieldsPage.fillInTextField("11111", fieldIndex);
  },

  /**
   * Waits for the Save button in a modal to be visible and clicks it.
   * Useful for dynamic/reference field modals that require explicit save.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async waitAndClickSaveButtonModal(page) {
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure
    await dynamicFieldsPage.waitForSaveButtonModal();
    await dynamicFieldsPage.clickSaveButtonModal();
    await travelRequestPage.waitForSentToAgentMessage();
    await checkoutPage.clickGoToTripButton();
  },

  /**
   * Waits for checkout page to be fully loaded (booking details heading visible).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async waitForCheckoutBookingDetails(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();
  },

  /**
   * Fills in a checkout reference field identified by its label text with a given value.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} fieldName - The visible label of the reference field (e.g. "ORDER NUMBER")
   * @param {string} value - The value to fill in (e.g. "1111")
   * @returns {Promise<void>}
   */
  async fillCheckoutReferenceField(page, fieldName, value) {
    if (!page) throw new Error('page is required');
    if (!fieldName || typeof fieldName !== 'string') throw new Error('fieldName must be a non-empty string, got: ' + typeof fieldName);
    if (value === undefined || value === null) throw new Error('value is required');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    // Small wait for checkout fields to fully render
    await page.waitForTimeout(2000);

    await dynamicFieldsPage.fillReferenceFieldByLabel(fieldName, String(value));
  },

  /**
   * Waits for a reference field dropdown to appear, selects an option, and proceeds.
   * If no reference field appears within the timeout, silently proceeds without error.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} fieldName - The name attribute of the dropdown (e.g. "Type of Trip")
   * @param {string} optionText - Text to match in the dropdown option (partial match supported)
   * @param {object} [options]
   * @param {number} [options.timeout=10000] - How long to wait for the field to appear
   * @returns {Promise<{fieldFound: boolean}>}
   */
  async selectReferenceFieldDropdownIfVisible(page, fieldName, optionText, { timeout = 10000 } = {}) {
    if (!page) throw new Error('page is required');
    if (!fieldName || typeof fieldName !== 'string') throw new Error('fieldName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');

    const commonPage = getPageObject(page, CommonPage);

    try {
      // Wait for the label text that contains the field name to appear
      const label = page.locator('label').filter({ hasText: fieldName }).first();
      await label.waitFor({ state: 'visible', timeout });

      // Find the el-select dropdown within the same field container
      const selectWrapper = label.locator('..').locator('.el-select').first();
      await selectWrapper.click();

      // Select the option by partial text match in the dropdown popup
      const option = page.locator('.el-select-dropdown__item').filter({ hasText: optionText }).first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();

      // Wait for and click Proceed button
      await commonPage.getProceedButton().waitFor({ state: 'visible', timeout: 10000 });
      await commonPage.clickProceedButton();

      return { fieldFound: true };
    } catch {
      // Reference field did not appear — silently proceed
      return { fieldFound: false };
    }
  },
};

// Export DynamicAndReferenceFields DSL for use in tests
module.exports = DynamicAndReferenceFields;
