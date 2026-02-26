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
    //await fop.closeFOPModal();
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
}

module.exports = CartPayment;

