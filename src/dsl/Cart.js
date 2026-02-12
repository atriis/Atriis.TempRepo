const { CartPage, SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { CommonPage, SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");
const { SELECTORS: CheckoutSelectors } = require("@pages/CheckoutPage");
const { expect } = require("@playwright/test");
const { GeneralElementsPage } = require("@pages/GeneralElementsPage");
const FlightResultsPage = require("@pages/FlightResultsPage");
const tripStatus = require("@data/tripStatus.json");

/**
 * Cart DSL
 *
 * Exposes business-level actions for cart flows.
 * - Explains intent
 * - Logs behavior
 * - Returns business-level results
 */
const Cart = {
  /**
   * STRICT cancel flow (fails if cancellation fails)
   *
   * This flow:
   * - Confirms Trip Overview page is loaded
   * - Opens actions menu
   * - Confirms cancellation
   * - Waits for success message
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cancelled: boolean}>}
   */
  async cancelTripStrict(page) {
    const cartPage = new CartPage(page);

    // Confirm correct page state
    await cartPage.waitForDetailsText();
    await cartPage.waitForTripOverviewTitle();
    // Open actions menu and cancel
    await cartPage.hoverTripActionsDropdownIcon();
    await cartPage.waitForDropdownMenu();
    await cartPage.clickCancelTripOption();

    // Confirm cancellation
    await cartPage.waitForTripCancellationDialogTitle();
    await cartPage.clickConfirmTripCancellationButton();

    // Will FAIL if message is not shown
    await cartPage.waitForTripCancelledMessage();

    // Allow backend and UI to settle
    await page.waitForLoadState("networkidle");

    return { cancelled: true };
  },

  /**
   * SAFE cancel flow (never throws, returns status)
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cancelled: boolean, error?: string}>}
   */
  async cancelTripSafely(page) {
    const cartPage = new CartPage(page);
    try {
      await cartPage.waitForDetailsText();
      await cartPage.waitForTripOverviewTitle();
      await cartPage.hoverTripActionsDropdownIcon();
      await cartPage.waitForDropdownMenu();
      await cartPage.clickCancelTripOption();
      await cartPage.waitForTripCancellationDialogTitle();
      await cartPage.clickConfirmTripCancellationButton();
      const wasCancelled = await cartPage.isTripCancelledMessageVisible();
      await page.waitForLoadState("networkidle");
      return { cancelled: wasCancelled };
    } catch (error) {
      return {
        cancelled: false,
        error: error?.message,
      };
    }
  },

  /**
   * Confirms that a hotel booking is refundable.
   * To better visualization in the test.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async isHotelRefundable(page) {
    const cartPage = new CartPage(page);
    await cartPage.waitForHotelRefundableText();
  },

  /**
   * Waits for a specific booking status label in the cart.
   * Throws a detailed error if the expected status is not found in time.
   *
   * @param {string} expectedStatus - Status text to wait for
   * @param {object} [options]
   * @param {number} [options.timeout=60000] - Timeout in ms
   * @param {import('playwright').Page} options.page - Playwright page instance
   * @returns {Promise<void>}
   */
  async expectBookingStatus(expectedStatus, { timeout = 60000, page } = {}) {
    const locator = page.locator(CART_SELECTORS.QUOTE_STATUS_LABEL);
    await expect(locator).toBeVisible({ timeout });
    await expect(locator).toContainText(expectedStatus, { timeout, ignoreCase: true });
  },

  /**
   * Opens share quote dialog and waits for the subject field to be visible.
   * Does NOT send the email - use isQuoteSent() to complete the flow.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickShareQuoteAndWaitForSubjectField(page) {
    const cartPage = new CartPage(page);
    const commonPage = new CommonPage(page);
    await cartPage.hoverShareButton();
    await cartPage.clickShareQuotes();
    await commonPage.waitForSubjectLabelSharePopUp();
  },

  /**
   * Opens share itinerary dialog and waits for the subject field to be visible.
   * Does NOT send the email - use isQuoteSent() to complete the flow.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickShareItineraryAndWaitForSubjectField(page) {
    const cartPage = new CartPage(page);
    const commonPage = new CommonPage(page);
    await cartPage.hoverShareButton();
    await cartPage.clickShareItinerary();
    await commonPage.waitForSubjectLabelSharePopUp();
  },

  /**
   * Sends a quote or itinerary email and waits for success notification.
   * Used after opening the share dialog with clickShareQuoteAndWaitForSubjectField.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{sent: boolean}>}
   */
  async sendQuoteAndWaitForSuccess(page) {
    const cartPage = new CartPage(page);
    const generalElementsPage = new GeneralElementsPage(page);

    await cartPage.clickSendEmailButton();
    await generalElementsPage.waitForSuccessNotification();
  },

  // ===== OUT OF POLICY (OOP) VALIDATION =====

  /**
   * Verifies that Out of Policy indicators are visible in cart page.
   * Used when validating travel policy enforcement on cart.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async verifyOutOfPolicyIndicatorIsVisibleInCart(page) {
    const commonPage = new CommonPage(page);
    await commonPage.waitForOOPVisible();
    await expect(page.locator(COMMON_SELECTORS.OOP_INFO)).toBeVisible();
  },

  /**
   * Verifies that Out of Policy indicators are not visible in cart page.
   * Used when validating in-policy options on cart.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async verifyOutOfPolicyIndicatorIsNotVisibleInCart(page) {
    const commonPage = new CommonPage(page);
    await commonPage.waitForOOPNotVisible();
    await expect(page.locator(COMMON_SELECTORS.OOP_INFO)).toBeHidden();
  },

  /**
   * Hovers over the Out of Policy info icon and validates tooltip text.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - The expected tooltip text
   */
  async hoverOverCartOOPInfoAndVerifyTooltipTextIs(page, expectedText) {
    const commonPage = new CommonPage(page);
    await commonPage.waitForOOPVisible();
    await commonPage.hoverOverOOPInfoIcon();
    const actualText = await commonPage.getOOPTooltipTextCart();
    expect(actualText).toBe(expectedText);
  },

  /**
   * Fills in the OOP justification text and saves it immediately.
   * Business-level action combining text input and save.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} justificationText - The justification text to enter
   * @returns {Promise<void>}
   */
  async fillInOOPJustificationTextAndSave(page, justificationText = "abc") {
    const cartPage = new CartPage(page);
    await cartPage.fillInOOPJustificationText(justificationText);
    await cartPage.saveOOPJustificationText();
  },

  /**
   * Opens the OOP justification dropdown and selects an option.
   * Business-level action for selecting a justification reason.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} justificationOption - The justification option to select
   * @returns {Promise<void>}
   */
  async selectOOPJustificationDropdownOptionAndSave(page, justificationOption) {
    const cartPage = new CartPage(page);
    await cartPage.openJustificationDropdown();
    await cartPage.waitForJustificationDropdownOption(justificationOption);
    await cartPage.selectJustificationDropdownOption(justificationOption);
    await cartPage.saveOOPJustificationText();
  },

  // ===== PRICE CHANGE MODAL =====


  /**
   * Accepts terms and proceeds to checkout.
   * Used by Flights, Hotels, and Cars.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{proceeded: boolean, clickedModal: boolean}>}
   */
  async acceptTermsAndConditionsAndProceedToCheckout(page) {
    const cartPage = new CartPage(page);
    const checkoutHeading = page.locator(CheckoutSelectors.BOOKING_DETAILS_HEADING);
    await cartPage.acceptTermsAndConditions();
    await cartPage.waitForProceedToCheckout();
    await cartPage.clickProceedToCheckout();

    // Race: wait for either the checkout heading or the price change modal (up to 45s)
    const proceedBtn = cartPage.getProceedWithChangeButton();
    await Promise.race([
      checkoutHeading.waitFor({ state: "visible", timeout: 45000 }).catch(() => {}),
      proceedBtn.waitFor({ state: "visible", timeout: 45000 }).catch(() => {}),
    ]);

    // If the modal appeared, click it and wait for checkout heading
    let clickedModal = false;
    if (await proceedBtn.isVisible()) {
      await proceedBtn.click();
      clickedModal = true;
    }

    // Confirm checkout page loaded (either directly or after dismissing modal)
    await checkoutHeading.waitFor({ state: "visible", timeout: 30000 });

    return { proceeded: true, clickedModal };
  },

  /**
   * Opens the fare rules drawer from cart flight details and waits for content.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the fare rules button (default: 1)
   * @returns {Promise<void>}
   */
  async clickToOpenFareRulesInCart(page, index = 1) {
    const flightResultsPage = new FlightResultsPage(page);
    await flightResultsPage.waitForFareRulesButton(index);
    await flightResultsPage.clickFareRulesButton(index);
    await flightResultsPage.waitForFareRulesNote();
  },

  async clickToOpenPriceBreakdown(page) {
    const cartPage = new CartPage(page);
    await cartPage.waitForPriceBreakdownButton();
    await cartPage.clickPriceBreakdownButton();
  },
  /**
   * Puts a trip on hold and waits for the status to update.
   * 
   * Flow:
   * - Wait for Hold button to be visible
   * - Click the Hold button
   * - Verify booking status changes to "On hold"
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{held: boolean}>} Hold status
   */
  async holdTrip(page) {
    const cartPage = new CartPage(page);
    await cartPage.waitForHoldButton();
    await cartPage.clickHoldButton();
    await Cart.expectBookingStatus(tripStatus.label.onHold.status, { page });
    return { held: true };
  },
};


// Export Cart DSL for use in tests
module.exports = Cart;
