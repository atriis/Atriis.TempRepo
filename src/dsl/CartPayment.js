/**
 * CartPayment DSL
 *
 * Business-level actions for adding a credit card as a form of payment to the cart.
 * Follows project conventions: no selectors, no UI details, no assertions.
 * Uses CartPaymentPage for low-level UI interactions.
 */

const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const CartPaymentPage = require("../pages/CartPaymentPage");
const cards = require("../data/cards.json");

class CartPayment {
  /**
   * Adds a credit card as a form of payment to the cart.
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {Object} cardData - Card details (defaults to Visa from cards.json)
   * @param {string} cardData.cardType
   * @param {string} cardData.cardHolderName
   * @param {string} cardData.expirationMonth
   * @param {string} cardData.expirationYear
   * @param {string} cardData.country
   * @param {string} cardData.cityName
   * @param {string} cardData.zipCode
   * @param {string} cardData.streetName
   * @param {string} cardData.cardNumber
   */
  static async addCreditCard(page, cardData = cards[0]) {
    const fop = getPageObject(page, CartPaymentPage);
    await fop.clickAddPaymentMethodButton();
    await fop.clickAddCardDetailsButton();
    await fop.waitForCardHolderNameInput();
    await fop.typeCardType(cardData.cardType);
    await fop.typeCardHolderName(cardData.cardHolderName);
    await fop.typeExpirationMonth(cardData.expirationMonth);
    await fop.typeExpirationYear(cardData.expirationYear);
    await fop.typeCountry(cardData.country);
    await fop.typeCityName(cardData.cityName);
    await fop.typeZipCode(cardData.zipCode);
    await fop.typeStreetName(cardData.streetName);
    await fop.clickInsertCreditCardNumberLink();
    await fop.typeCardNumberInModal(cardData.cardNumber);
    await fop.waitForSaveCardModalButton();
    await fop.clickSaveCardModalButton();
    await fop.clickSaveCardButton();
    // Close modal dialogs (tries multiple indices, each returns true/false if found)
    // These are optional and may not exist depending on the payment flow
    await fop.closeFOPModal(0); // First modal (if present)
    await fop.closeFOPModal(1); // Second modal (if present)
    await fop.closeFOPModal(2); // Third modal (if present)
  }

  /**
   * Checks if a payment method has been successfully added to the cart.
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @returns {Promise<boolean>} True if payment method green icon is visible
   */
  static async isPaymentMethodAdded(page) {
    const fop = getPageObject(page, CartPaymentPage);
    return await fop.waitForGreenIconInCart();
  }

  /**
   * Validates that a saved card is visible in the payment methods list.
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {string} cardName - Name of the card to check for visibility (required)
   * @throws {Error} If page or cardName are not provided
   * @returns {Promise<void>}
   */
  static async expectCardVisible(page, cardName) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error('cardName must be a non-empty string');
    }
    const fop = getPageObject(page, CartPaymentPage);
    await expect(fop.getCardByName(cardName)).toBeVisible();
  }

  /**
   * Validates that the Card Details section is visible.
   * Used to verify the payment form has loaded before entering card information.
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @throws {Error} If page is not provided
   * @returns {Promise<void>}
   */
  static async waitForCardDetailsToBeVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }
    const fop = getPageObject(page, CartPaymentPage);
    await expect(fop.getCardDetailsTitle()).toBeVisible();
  }

  /**
   * Fills the CVV field if it is visible, otherwise does nothing.
   * Used for payment flows where CVV may or may not be required.
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {string} cvv - CVV code (defaults to "123")
   * @throws {Error} If page is not provided
   * @returns {Promise<void>}
   */
  static async fillCreditCardCVVifNeeded(page, cvv = "123") {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cvv || typeof cvv !== 'string') {
      throw new Error('cvv must be a non-empty string');
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.fillCVV(cvv);
  }

  /**
   * Validates the count of visible payment cards in the FOP panel.
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {number} expectedCount - Expected number of visible cards
   * @throws {Error} If page or expectedCount are invalid
   * @returns {Promise<void>}
   */
  static async verifyCardCount(page, expectedCount) {
    if (!page) {
      throw new Error('page is required');
    }
    if (typeof expectedCount !== 'number') {
      throw new Error('expectedCount must be a number, got: ' + typeof expectedCount);
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    const actualCount = await paymentPage.getCardCount();
    expect(actualCount, `Expected ${expectedCount} payment cards, but found ${actualCount}`).toBe(expectedCount);
  }

  /**
   * Selects an existing saved card by name in the FOP panel.
   * @param {import('@playwright/test').Page} page
   * @param {string} cardName
   */
  static async selectCardByName(page, cardName) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error('cardName must be a non-empty string, got: ' + typeof cardName);
    }

    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickCardCheckboxByName(cardName);
  }

  /**
   * Verifies payment restriction field label is visible after selecting billback card.
   * @param {import('@playwright/test').Page} page
   */
  static async verifyPaymentRestrictionFieldVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.waitForPaymentRestrictionLabel();
  }

  /**
   * Opens payment restriction dropdown options.
   * @param {import('@playwright/test').Page} page
   */
  static async openPaymentRestrictionOptions(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickPaymentRestrictionControl();
  }

  /**
   * Verifies specific payment restriction options are visible in dropdown.
   * @param {import('@playwright/test').Page} page
   * @param {string[]} options
   */
  static async verifyPaymentRestrictionOptions(page, options) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Array.isArray(options)) {
      throw new Error('options must be an array, got: ' + typeof options);
    }
    if (options.length === 0) {
      throw new Error('options must be a non-empty array, got length: 0');
    }

    const paymentPage = getPageObject(page, CartPaymentPage);
    for (const option of options) {
      if (!option || typeof option !== 'string') {
        throw new Error('each option must be a non-empty string, got: ' + typeof option);
      }
      await expect(paymentPage.getPaymentRestrictionOption(option)).toBeVisible();
    }
  }
}

module.exports = CartPayment;

