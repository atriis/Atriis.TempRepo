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
   * Fills credit card details when the card details form is already open.
   * Unlike addCreditCard, this does NOT click "Add payment method" or "Add card details".
   * @param {import('@playwright/test').Page} page
   * @param {Object} cardData - Card details (defaults to Visa from cards.json)
   */
  static async fillCreditCardDetails(page, cardData = cards[0]) {
    if (!page) {
      throw new Error("page is required");
    }
    const fop = getPageObject(page, CartPaymentPage);
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
    await fop.closeFOPModal(0);
    await fop.closeFOPModal(1);
    await fop.closeFOPModal(2);
  }

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
    await CartPayment.fillCreditCardDetails(page, cardData);
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
      throw new Error("page is required");
    }
    if (!cardName || typeof cardName !== "string") {
      throw new Error("cardName must be a non-empty string");
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
      throw new Error("page is required");
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
      throw new Error("page is required");
    }
    if (!cvv || typeof cvv !== "string") {
      throw new Error("cvv must be a non-empty string");
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
      throw new Error("page is required");
    }
    if (typeof expectedCount !== "number") {
      throw new Error(
        "expectedCount must be a number, got: " + typeof expectedCount,
      );
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    const actualCount = await paymentPage.getCardCount();
    expect(
      actualCount,
      `Expected ${expectedCount} payment cards, but found ${actualCount}`,
    ).toBe(expectedCount);
  }

  /**
   * Selects an existing saved card by name in the FOP panel.
   * @param {import('@playwright/test').Page} page
   * @param {string} cardName
   */
  static async selectCardByName(page, cardName) {
    if (!page) {
      throw new Error("page is required");
    }
    if (!cardName || typeof cardName !== "string") {
      throw new Error(
        "cardName must be a non-empty string, got: " + typeof cardName,
      );
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
      throw new Error("page is required");
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
      throw new Error("page is required");
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
      throw new Error("page is required");
    }
    if (!Array.isArray(options)) {
      throw new Error("options must be an array, got: " + typeof options);
    }
    if (options.length === 0) {
      throw new Error("options must be a non-empty array, got length: 0");
    }

    const paymentPage = getPageObject(page, CartPaymentPage);
    for (const option of options) {
      if (!option || typeof option !== "string") {
        throw new Error(
          "each option must be a non-empty string, got: " + typeof option,
        );
      }
      await expect(
        paymentPage.getPaymentRestrictionOption(option),
      ).toBeVisible();
    }
  }
  /**
   * Verifies that a credit card looks disabled (not supported) in the FOP panel.
   * @param {import('@playwright/test').Page} page
   * @param {string} cardName - Name of the card expected to be disabled
   */
  static async verifyCardLooksDisabled(page, cardName) {
    if (!page) {
      throw new Error("page is required");
    }
    if (!cardName || typeof cardName !== "string") {
      throw new Error(
        "cardName must be a non-empty string, got: " + typeof cardName,
      );
    }

    const paymentPage = getPageObject(page, CartPaymentPage);
    const isDisabled = await paymentPage.isCardDisabled(cardName);
    expect(
      isDisabled,
      `Expected card "${cardName}" to look disabled but it appears enabled`,
    ).toBe(true);
  }

  /**
   * Clicks the "Set Billback" button in the cart FOP section.
   * Opens the select-credit-card modal for billback configuration.
   * @param {import('@playwright/test').Page} page
   */
  static async clickSetBillback(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickSetBillbackButton();
  }

  /**
   * Verifies that the "Add card" button is NOT visible (no other CC privilege).
   * @param {import('@playwright/test').Page} page
   */
  static async verifyNoOtherCCPrivilege(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isVisible = await paymentPage.isAddCardButtonVisible();
    expect(isVisible, 'Expected "Add card" button to be hidden (no other CC privilege)').toBe(false);
  }

  /**
   * Clicks the billback checkbox to select/toggle billback payment.
   * @param {import('@playwright/test').Page} page
   */
  static async selectBillback(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickBillbackCheckbox();
  }

  /**
   * Verifies that the billback checkbox is checked.
   * @param {import('@playwright/test').Page} page
   */
  static async verifyBillbackChecked(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isChecked = await paymentPage.isBillbackCheckboxChecked();
    expect(isChecked, 'Expected billback checkbox to be checked').toBe(true);
  }

  /**
   * Verifies that specific payment method options are visible (e.g., "Pay on departure", "Pre-paid").
   * @param {import('@playwright/test').Page} page
   * @param {string[]} options - Array of payment option texts to verify
   */
  static async verifyPaymentOptions(page, options) {
    if (!page) throw new Error("page is required");
    if (!Array.isArray(options)) throw new Error("options must be an array, got: " + typeof options);
    const paymentPage = getPageObject(page, CartPaymentPage);
    for (const option of options) {
      const isVisible = await paymentPage.isPaymentMethodOptionVisible(option);
      expect(isVisible, `Expected payment option "${option}" to be visible`).toBe(true);
    }
  }

  /**
   * Selects a payment method option by text and saves.
   * @param {import('@playwright/test').Page} page
   * @param {string} optionText - The payment option to select (e.g., "Pay on departure")
   */
  static async selectPaymentOption(page, optionText) {
    if (!page) throw new Error("page is required");
    if (!optionText || typeof optionText !== "string") throw new Error("optionText must be a non-empty string");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickPaymentMethodOption(optionText);
    await paymentPage.clickPaymentMethodSaveButton();
  }

  /**
   * Verifies that payment restrictions are displayed for a given payment option.
   * @param {import('@playwright/test').Page} page
   * @param {string} optionText - The payment option that triggers restrictions (e.g., "Pre-paid")
   */
  static async verifyPaymentRestrictions(page, optionText) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isVisible = await paymentPage.isPaymentRestrictionsContainerVisible();
    expect(isVisible, `Expected payment restrictions to be displayed for "${optionText}"`).toBe(true);
  }
}

module.exports = CartPayment;
