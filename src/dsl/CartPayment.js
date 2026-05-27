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
   * Saves the card selection by clicking the Save button (.btn-save).
   * @param {import('@playwright/test').Page} page
   */
  static async saveCardSelection(page) {
    if (!page) {
      throw new Error("page is required");
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickSaveCardButton();
    await page.waitForLoadState('networkidle');
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
   * Selects the first available payment restriction option from the open dropdown.
   * @param {import('@playwright/test').Page} page
   */
  static async selectFirstPaymentRestrictionOption(page) {
    if (!page) {
      throw new Error('[CartPayment.selectFirstPaymentRestrictionOption] "page" is required.');
    }

    try {
      const paymentPage = getPageObject(page, CartPaymentPage);
      await paymentPage.selectFirstPaymentRestrictionOption();
    } catch (err) {
      throw new Error(
        `[CartPayment.selectFirstPaymentRestrictionOption] Failed to select the first payment restriction option. ` +
        `Ensure the payment restriction dropdown is open before calling this method. Original: ${err.message}`
      );
    }
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
   * Verifies that a card's checkbox is checked, matched by card name string.
   * @param {import('@playwright/test').Page} page
   * @param {string} cardName - Substring to match against card label text
   */
  static async verifyCardCheckboxChecked(page, cardName) {
    if (!page) throw new Error("page is required");
    if (!cardName || typeof cardName !== 'string') throw new Error("cardName must be a non-empty string");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isChecked = await paymentPage.isCardCheckboxCheckedByName(cardName);
    expect(isChecked, `Expected "${cardName}" checkbox to be checked`).toBe(true);
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

  // ===== Missing card info flow (feature 64405) =====

  /**
   * Verifies that the "Complete missing info" button is visible on the current card.
   * @param {import('@playwright/test').Page} page
   */
  static async verifyCompleteMissingInfoButtonVisible(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isVisible = await paymentPage.isCompleteMissingInfoButtonVisible();
    expect(isVisible, 'Expected "Complete missing info" button to be visible on card').toBe(true);
  }

  /**
   * Clicks the "Complete missing info" button to open the card edit form.
   * @param {import('@playwright/test').Page} page
   */
  static async clickCompleteMissingInfo(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickCompleteMissingInfoButton();
  }

  /**
   * Verifies the "In order to proceed, please add all required information" warning is visible.
   * @param {import('@playwright/test').Page} page
   */
  static async verifyInOrderToProceedWarningVisible(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isVisible = await paymentPage.isFormPaymentErrorVisible();
    expect(isVisible, 'Expected "In order to proceed" warning to be visible').toBe(true);
  }

  /**
   * Verifies the last 4 digits of the credit card are displayed in the FOP section
   * as masked text ("****{last4}").
   * @param {import('@playwright/test').Page} page
   * @param {string} last4 - The last 4 digits expected (e.g., "4580")
   */
  static async verifyLastFourDigitsOfCreditCard(page, last4) {
    if (!page) throw new Error("page is required");
    if (!last4 || typeof last4 !== 'string') {
      throw new Error(`last4 must be a non-empty string, got: ${last4}`);
    }
    if (!/^\d{4}$/.test(last4)) {
      throw new Error(`last4 must be exactly 4 digits, got: "${last4}"`);
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    const expected = `****${last4}`;
    const actual = await paymentPage.getLastFourDigitText();
    expect(actual, `Expected FOP last-four-digit to be "${expected}"`).toBe(expected);
  }

  /**
   * Verifies the "In order to proceed" warning is NOT visible (dismissed).
   * @param {import('@playwright/test').Page} page
   */
  static async verifyInOrderToProceedWarningGone(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const el = paymentPage.page.locator('.form-payment-err').first();
    await expect(el).toBeHidden({ timeout: 30000 });
  }

  /**
   * Verifies the missing card details form shows "Missing details" title and expected labels.
   * Optionally checks card display name and masked digits.
   * @param {import('@playwright/test').Page} page
   * @param {object} options
   * @param {string} options.sectionTitle - Expected section title (e.g., "Missing details")
   * @param {string[]} options.labels - Expected field labels (e.g., ["Card holder name *"])
   */
  static async verifyMissingCardDetailsForm(page, { sectionTitle, labels } = {}) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);

    if (sectionTitle) {
      const actual = await paymentPage.getSelectedCardSectionTitle();
      expect(actual, `Expected section title to be "${sectionTitle}"`).toBe(sectionTitle);
    }

    if (labels && labels.length > 0) {
      const actualLabels = await paymentPage.getMissingCardDetailsLabels();
      for (const expectedLabel of labels) {
        const found = actualLabels.some(l => l.includes(expectedLabel.replace(' *', '').trim()));
        expect(found, `Expected label "${expectedLabel}" to be present in form. Found: ${JSON.stringify(actualLabels)}`).toBe(true);
      }
    }
  }

  /**
   * Clicks Save in the missing card details form and verifies a validation error appears.
   * @param {import('@playwright/test').Page} page
   */
  static async saveCardFormAndVerifyValidationError(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickSelectedCardSaveButton();
    const hasError = await paymentPage.isValidationErrorVisible();
    expect(hasError, 'Expected a validation error (red border) to appear after saving empty required field').toBe(true);
  }

  /**
   * Fills in the card holder name in the missing card details form.
   * @param {import('@playwright/test').Page} page
   * @param {string} name - Card holder name to enter
   */
  static async fillMissingCardHolderName(page, name) {
    if (!page) throw new Error("page is required");
    if (!name || typeof name !== 'string') throw new Error("name must be a non-empty string, got: " + typeof name);
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.fillMissingCardHolderName(name);
  }

  /**
   * Verifies the card holder name input in the cart contains the expected substring.
   * @param {import('@playwright/test').Page} page
   * @param {string} expectedSubstring - Substring expected within the card holder name field value
   * @returns {Promise<{cardHolderName: string}>} The actual card holder name value read from the input
   */
  static async verifyCardHolderNameContains(page, expectedSubstring) {
    if (!page) throw new Error("page is required");
    if (!expectedSubstring || typeof expectedSubstring !== 'string') {
      throw new Error("expectedSubstring must be a non-empty string, got: " + typeof expectedSubstring);
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    const cardHolderName = await paymentPage.getDisplayedCardHolderName();
    expect(
      cardHolderName,
      `Card holder name field should contain "${expectedSubstring}" but was "${cardHolderName}"`
    ).toContain(expectedSubstring);
    return { cardHolderName };
  }

  /**
   * Saves the missing card details form (clicks Save button).
   * @param {import('@playwright/test').Page} page
   */
  static async saveMissingCardDetails(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickSelectedCardSaveButton();
  }

  /**
   * Clicks the edit card link to open card selection from the trip overview.
   * @param {import('@playwright/test').Page} page
   */
  static async clickEditCard(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickEditCardLink();
  }

  /**
   * Verifies the edit card button/link is NOT displayed in the payment section.
   * Used for users without "Can Select FOP at the Cart" permission.
   * @param {import('@playwright/test').Page} page
   */
  static async verifyEditCardNotDisplayed(page) {
    if (!page) throw new Error('[CartPayment.verifyEditCardNotDisplayed] "page" is required.');
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isVisible = await paymentPage.isEditCardLinkVisible({ timeout: 3000 });
    if (isVisible) {
      throw new Error(
        `[CartPayment.verifyEditCardNotDisplayed] The edit card link IS visible, but should be hidden. ` +
        `This user should not have "Can Select FOP at the Cart" permission — check user configuration.`
      );
    }
  }

  /**
   * Clicks the checkbox for the "no country" card (second card in the select panel).
   * @param {import('@playwright/test').Page} page
   */
  static async selectNoCountryCard(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickNoCountryCardCheckbox();
  }

  /**
   * Selects the first available country in the country dropdown in missing card details form.
   * @param {import('@playwright/test').Page} page
   */
  static async selectFirstCountry(page) {
    if (!page) throw new Error("page is required");
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.selectFirstCountryInDropdown();
  }

  /**
   * Verifies that a card with the given name text is visible in the FOP panel.
   * @param {import('@playwright/test').Page} page
   * @param {string} cardNameText - Partial or full card name text to match
   */
  static async verifyCardNameVisible(page, cardNameText) {
    if (!page) throw new Error("page is required");
    if (!cardNameText || typeof cardNameText !== 'string') throw new Error("cardNameText must be a non-empty string");
    const paymentPage = getPageObject(page, CartPaymentPage);
    const names = await paymentPage.getAllCardNames();
    const found = names.some(n => n.includes(cardNameText));
    expect(found, `Expected card with name "${cardNameText}" to be visible. Found: ${JSON.stringify(names)}`).toBe(true);
  }

  /**
   * Selects a saved card by its 1-based index and saves the selection.
   * @param {import('@playwright/test').Page} page
   * @param {number} index - 1-based index of the card to select
   */
  static async selectCardByIndexAndSave(page, index) {
    if (!page) throw new Error("page is required");
    if (typeof index !== 'number' || index < 1) {
      throw new Error(`index must be >= 1, got: ${index}`);
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.clickCardCheckboxByIndex(index);
    await paymentPage.clickSaveCardButton();
  }

  /**
   * Asserts that the CVV field is NOT displayed in the payment panel.
   * Use this to verify that a payment option does not require CVV entry.
   * @param {import('@playwright/test').Page} page
   */
  /**
   * Opens the expiration year dropdown in the Add Card Details form.
   * Leaves the panel open so its items can be counted or inspected.
   * @param {import('@playwright/test').Page} page
   */
  static async openExpirationYearDropdown(page) {
    if (!page) throw new Error('[CartPayment.openExpirationYearDropdown] "page" is required.');
    const paymentPage = getPageObject(page, CartPaymentPage);
    await paymentPage.openExpirationYearDropdown();
  }

  /**
   * Asserts that the currently-open dropdown displays exactly {expectedCount} items starting with {prefix}.
   * @param {import('@playwright/test').Page} page
   * @param {number} expectedCount - Expected number of items
   * @param {string} prefix - Text prefix each item must start with (e.g. '2')
   */
  static async verifyDropdownItemCount(page, expectedCount, prefix) {
    if (!page) throw new Error('[CartPayment.verifyDropdownItemCount] "page" is required.');
    if (typeof expectedCount !== 'number' || expectedCount < 1) {
      throw new Error(`[CartPayment.verifyDropdownItemCount] "expectedCount" must be a positive number, got: ${expectedCount}`);
    }
    if (!prefix || typeof prefix !== 'string') {
      throw new Error(`[CartPayment.verifyDropdownItemCount] "prefix" must be a non-empty string, got: ${typeof prefix}`);
    }
    const paymentPage = getPageObject(page, CartPaymentPage);
    const actual = await paymentPage.countOpenDropdownItemsStartingWith(prefix);
    expect(
      actual,
      `Expected expiration year dropdown to show exactly ${expectedCount} entries starting with "${prefix}", but found ${actual}. ` +
      `This usually means the dropdown did not open correctly or the year range configured for this environment differs from expected.`
    ).toBe(expectedCount);
  }

  static async verifyCVVFieldNotVisible(page) {
    if (!page) throw new Error('page is required');
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isVisible = await paymentPage.isCVVFieldVisible({ timeout: 3000 });
    expect(isVisible, 'Expected CVV field to not be displayed, but it is visible').toBe(false);
  }

  /**
   * Fills the CVV field and asserts it is visible — fails the test if CVV field is not shown.
   * Use this when CVV is required (not optional). Complements fillCreditCardCVVifNeeded.
   * @param {import('@playwright/test').Page} page
   * @param {string} [cvv='123'] - CVV code to enter
   */
  static async fillCreditCardCVV(page, cvv = '123') {
    if (!page) throw new Error('page is required');
    if (!cvv || typeof cvv !== 'string') throw new Error('cvv must be a non-empty string, got: ' + typeof cvv);
    const paymentPage = getPageObject(page, CartPaymentPage);
    const isVisible = await paymentPage.isCVVFieldVisible({ timeout: 20000 });
    if (!isVisible) {
      throw new Error('CVV field is not displayed — expected CVV to be required for this payment option');
    }
    await paymentPage.fillCVV(cvv);
  }
}

module.exports = CartPayment;
