const { getPageObject } = require("@utils/pageObjectCache");
const DynamicAndReferenceFieldsPage = require("@pages/DynamicAndReferenceFieldsPage");
const { GeneralElementsPage } = require("@pages/GeneralElementsPage");
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
    const generalElementsPage = getPageObject(page, GeneralElementsPage);

    // Open the Trip Purpose dropdown
    await dynamicFieldsPage.clickToOpenDropdown("TRIP PURPOSE");

    // Wait for and select CONFERENCE option
    await dynamicFieldsPage.waitForDropdownOption("CONFERENCE");
    await dynamicFieldsPage.selectDropdownOption("CONFERENCE");

    // Wait for and click Proceed button
    await generalElementsPage.waitForProceedButton();
    await generalElementsPage.clickProceedButton();
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
};

// Export DynamicAndReferenceFields DSL for use in tests
module.exports = DynamicAndReferenceFields;
