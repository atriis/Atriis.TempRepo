const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CheckoutPage } = require("@pages/CheckoutPage");
const { CartPage } = require("@pages/CartPage");
const { CommonPage } = require("@pages/CommonPage");

/**
 * Checkout DSL
 *
 * High-level booking finalization flow.
 * Describes WHAT the user does, not HOW the UI works.
 */
const Checkout = {
  /**
   * Completes the booking without navigating to the Trip Overview.
   *
   * This flow:
   * - waits for checkout details
   * - finalizes the booking
   */
  async bookTripWithoutNavigatingToTripOverview(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Wait for a valid finalize button variant
    await checkoutPage.waitForBookAndFinalizeButton();

    // Finalize the booking (button text may vary)
    await checkoutPage.clickBookAndFinalizeButton();
  },

  /**
   * Finalizes the booking and navigates to the Trip Overview.
   *
   * This flow:
   * - waits for checkout details
   * - finalizes the booking
   * - navigates to the trip overview page
   */
  async bookAndFinalize(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);

    await Checkout.bookTripWithoutNavigatingToTripOverview(page);

    // Navigate to trip overview
    await checkoutPage.clickGoToTrip();

    // Confirm trip overview is displayed
    await cartPage.waitForTripOverviewTitle();

    return { finalized: true };
  },

  /**
   * Finalizes the booking for Fusion low-cost flights that require a card verification step,
   * then navigates to the trip overview page.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{finalized: boolean}>}
   */
  async bookAndFinalizeWithFusionCardVerification(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);

    await Checkout.bookTripWithoutNavigatingToTripOverview(page);
    await checkoutPage.completeFusionCardVerification();
    await checkoutPage.clickGoToTrip();
    await cartPage.waitForTripOverviewTitle();

    return { finalized: true };
  },

  /**
   * Verifies that a booking error dialog is displayed after a failed booking attempt.
   *
   * This flow:
   * - waits for the booking error dialog to appear
   */
  async verifyBookingErrorMessage(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.waitForBookingErrorDialog();
  },

  /**
   * Clicks the "Back to trip" button inside the booking error dialog.
   *
   * This flow:
   * - clicks the back to trip button
   */
  async clickBackToTripButton(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.clickBackToTripButton();
  },

  /**
   * Navigates to cart from the checkout page.
   *
   * This flow:
   * - waits for checkout details
   * - clicks the trip cart icon
   * - confirms cart page is displayed
   */
  async navigateToCartFromCheckout(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const commonPage = getPageObject(page, CommonPage);
    const cartPage = getPageObject(page, CartPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Wait for a valid finalize button variant
    await checkoutPage.waitForBookAndFinalizeButton();
    await commonPage.clickTripCart();

    // Confirm trip overview is displayed
    await cartPage.waitForTripOverviewTitle();

    return { navigatedToCart: true };
  },

  /**
   * Verifies the contact email on the checkout page contains the expected text.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Substring expected in the email value
   */
  async verifyContactEmailContains(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (typeof expectedText !== 'string') throw new Error('expectedText must be a string, got: ' + typeof expectedText);

    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);
    const emailValue = await checkoutPage.getEmailInputValue();
    expect(emailValue).toContain(expectedText);
  },

  async verifyContactPhoneContainsNumbers(page) {
    if (!page) throw new Error('page is required');
    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);
    const values = await checkoutPage.getContactPhoneValues();
    expect(values).toMatch(/\d/);
  },

  /**
   * Verifies the contact details sharing checkbox is unchecked on first load.
   *
   * @param {import('playwright').Page} page
   */
  async verifyContactDetailsCheckboxUnchecked(page) {
    if (!page) throw new Error('page is required');

    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.waitForBookingDetailsText();

    const isChecked = await checkoutPage.isContactDetailsCheckboxChecked();
    expect(isChecked, 'Expected contact details checkbox to be unchecked by default').toBe(false);
  },

  /**
   * Clicks the contact-details sharing checkbox on checkout.
   *
   * @param {import('playwright').Page} page
   */
  async clickContactDetailsCheckbox(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();
    await checkoutPage.clickContactDetailsCheckbox();
  },

  /**
   * Verifies the checkout trip summary total matches the expected cart total.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedTotal
   * @returns {Promise<{checkoutTotal: number, expectedTotal: number}>}
   */
  async verifyCheckoutTotalMatchesExpected(page, expectedTotal) {
    if (!page) throw new Error('page is required');
    if (typeof expectedTotal !== 'number' || Number.isNaN(expectedTotal)) {
      throw new Error(`expectedTotal must be a valid number, got: ${expectedTotal}`);
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();

    const checkoutTotal = await checkoutPage.getCheckoutTotalPrice();
    if (checkoutTotal === null) {
      throw new Error('Checkout total price is not visible');
    }

    expect(Math.abs(checkoutTotal - expectedTotal)).toBeLessThanOrEqual(1);

    return { checkoutTotal, expectedTotal };
  },

  async verifyBookerNotificationPhoneContainsNumbers(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    const values = await checkoutPage.getBookerNotificationPhoneValues();
    if (values === null) return; // section not visible for this user/config — skip
    const { expect } = require("@playwright/test");
    expect(values).toMatch(/\d/);
  },

  /**
   * Unchecks the "Don't share contact details with airlines" checkbox
   * and fills in the traveler phone number on the checkout page.
   *
   * @param {import('playwright').Page} page
   * @param {string} countryCode - Phone country code (e.g. "1")
   * @param {string} areaCode - Phone area code (e.g. "505")
   * @param {string} phoneNumber - Phone number (e.g. "1001000")
   */
  async uncheckContactSharingAndEditPhone(page, countryCode, areaCode, phoneNumber) {
    if (!page) throw new Error('page is required');
    if (typeof countryCode !== 'string') throw new Error('countryCode must be a string, got: ' + typeof countryCode);
    if (typeof areaCode !== 'string') throw new Error('areaCode must be a string, got: ' + typeof areaCode);
    if (typeof phoneNumber !== 'string') throw new Error('phoneNumber must be a string, got: ' + typeof phoneNumber);

    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure checkout page is loaded
    await checkoutPage.waitForBookingDetailsText();

    // Uncheck the "Don't share contact details" checkbox to enable phone fields
    await checkoutPage.clickContactDetailsCheckbox();

    // Fill phone fields
    await checkoutPage.fillContactPhoneCountryCode(countryCode);
    await checkoutPage.fillContactPhoneAreaCode(areaCode);
    await checkoutPage.fillContactPhoneNumber(phoneNumber);
  },

  /**
   * Edits the traveler contact email on the checkout page.
   *
   * @param {import('playwright').Page} page
   * @param {string} email
   */
  async editContactEmail(page, email) {
    if (!page) throw new Error('page is required');
    if (typeof email !== 'string') throw new Error('email must be a string, got: ' + typeof email);
    if (!email.trim()) throw new Error('email must be a non-empty string');

    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.waitForBookingDetailsText();
    await checkoutPage.fillContactEmail(email);
  },

  /**
   * Sends the booking for approval and navigates to the Trip Overview.
   *
   * This flow:
   * - waits for checkout details
   * - clicks "Send for approval"
   * - validates the approval success message
   * - navigates to the trip overview page
   */
  async sendForApprovalAndFinalize(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting
    await page.waitForTimeout(4000);

    // Wait for and click "Send for approval"
    await checkoutPage.waitForSendForApprovalButton();
    await checkoutPage.clickSendForApprovalButton();

    // Wait for the approval success page to load
    await checkoutPage.waitForApprovalSuccessPage();

    // Validate the approval success message
    const approvalMessage = await checkoutPage.getApprovalSuccessMessageText();
    if (!approvalMessage.includes('booked and sent')) {
      throw new Error(`Unexpected approval message: "${approvalMessage}"`);
    }

    // Intentional wait required for UI stability before interacting
    await page.waitForTimeout(2000);

    // Navigate to trip overview from the approval success page
    await checkoutPage.clickApprovalSuccessGoToTrip();

    // Confirm trip overview content is displayed
    await cartPage.waitForTripOverviewTitle();
    await cartPage.waitForTripOverviewQuoteContent();

    return { sentForApproval: true };
  },
};

module.exports = Checkout;
