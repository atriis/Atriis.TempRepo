
/**
 * CartPaymentPage
 *
 * Handles low-level UI interactions inside the FOP (Form of Payment) modal on the cart page.
 * Follows project guidelines:
 * - No business logic or assertions
 * - No logging
 * - Only exposes technical UI actions
 */

const SELECTORS = {
  // "Add Payment Method" modal selectors
  DROPDOWN_WRAPPER: ".el-select__wrapper",
  CARD_HOLDER_NAME_INPUT: "[placeholder=\"Card holder name\"]",
  CITY_NAME_INPUT: "[placeholder=\"City name\"]",
  ZIP_CODE_INPUT: "[placeholder=\"Zip code\"]",
  STREET_NAME_INPUT: "[placeholder=\"Street name\"]",
  INSERT_CREDIT_CARD_NUMBER_LINK: ".insertCard",
  SAVE_CARD: ".btn-save",
  CARD_NAME_LIST: '.card-name',
  CARD_DETAILS_TITLE: 'p.section-title',
  BACK_ARROW: 'span.material-symbols-outlined:has-text("chevron_left")',
  // "Insert Credit Card Number" modal selectors
  INSERT_CREDIT_CARD_NUMBER_FIELD: "[placeholder=\"Please enter your credit card number\"]",
  SAVE_CARD_MODAL_BUTTON: ".btn.flex button.btn.btn--primary.btn--size-default.btn--round",
  // Green icon cart
  GREEN_ICON_CART: ".material-symbols-outlined.payment-status-icon.filled.green",
};

class CartPaymentPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the card type dropdown element (first dropdown).
   * @returns {import('@playwright/test').Locator}
   */
  getCardTypeDropdown() {
    return this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(0);
  }

  /**
   * Gets the expiration month dropdown element (second dropdown).
   * @returns {import('@playwright/test').Locator}
   */
  getExpirationMonthDropdown() {
    return this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(1);
  }

  /**
   * Gets the expiration year dropdown element (third dropdown).
   * @returns {import('@playwright/test').Locator}
   */
  getExpirationYearDropdown() {
    return this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(2);
  }

  /**
   * Gets the country dropdown element (fourth dropdown).
   * @returns {import('@playwright/test').Locator}
   */
  getCountryDropdown() {
    return this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(3);
  }

  /**
   * Gets the Card Details title heading.
   * @returns {import('@playwright/test').Locator}
   */
  getCardDetailsTitle() {
    return this.page.locator(SELECTORS.CARD_DETAILS_TITLE).filter({ hasText: 'Card details' });
  }

  /**
   * Gets a saved card element by its name.
   * @param {string} cardName - Name of the card to locate (required)
   * @returns {import('@playwright/test').Locator}
   * @throws {Error} If cardName is not provided
   */
  getCardByName(cardName) {
    if (!cardName || typeof cardName !== 'string') {
      throw new Error('cardName must be a non-empty string');
    }
    return this.page.locator(SELECTORS.CARD_NAME_LIST).filter({ hasText: cardName });
  }

  /**
   * Waits for the Card Details section to be visible.
   */
  async waitForCardDetailsToBeVisible() {
    await this.getCardDetailsTitle().waitFor({ state: 'visible' });
  }

  /**
   * Clicks the button to open the Add Payment Method modal.
   */
  async clickAddPaymentMethodButton() {
    const button = this.page.getByRole("button", { name: "Add payment method" });
    await button.waitFor({ state: "visible" });
    await button.click();
  }

  /**
   * Clicks the button to open the Add Card Details modal.
   */
  async clickAddCardDetailsButton() {
    const button = this.page.getByRole("button", { name: "Add card details" });
    await button.waitFor({ state: "visible" });
    await button.click();
  }

  /**
   * Waits for the Card Holder Name input to be visible in the modal.
   */
  async waitForCardHolderNameInput() {
    const input = this.page.locator(SELECTORS.CARD_HOLDER_NAME_INPUT).first();
    await input.waitFor({ state: "visible" });
  }

  /**
   * Selects the card type from the dropdown.
   * @param {string} cardType - Card type to select (required)
   * @throws {Error} If cardType is not provided
   */
  async typeCardType(cardType) {
    if (!cardType || typeof cardType !== 'string') {
      throw new Error('cardType must be a non-empty string');
    }
    await this.getCardTypeDropdown().click();
    await this.page.keyboard.type(cardType);
    await this.page.getByRole("option", { name: cardType }).click();
  }

  /**
   * Types the card holder name into the input.
   * @param {string} name - Card holder name (required)
   * @throws {Error} If name is not provided
   */
  async typeCardHolderName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('name must be a non-empty string');
    }
    await this.page.fill(SELECTORS.CARD_HOLDER_NAME_INPUT, name);
  }

  /**
   * Selects the expiration month from the dropdown.
   * @param {string} expirationMonth - Expiration month (required)
   * @throws {Error} If expirationMonth is not provided
   */
  async typeExpirationMonth(expirationMonth) {
    if (!expirationMonth || typeof expirationMonth !== 'string') {
      throw new Error('expirationMonth must be a non-empty string');
    }
    await this.getExpirationMonthDropdown().click();
    await this.page.keyboard.type(expirationMonth);
    await this.page.getByRole("option", { name: expirationMonth }).click();
  }

  /**
   * Selects the expiration year from the dropdown.
   * @param {string} expirationYear - Expiration year (required)
   * @throws {Error} If expirationYear is not provided
   */
  async typeExpirationYear(expirationYear) {
    if (!expirationYear || typeof expirationYear !== 'string') {
      throw new Error('expirationYear must be a non-empty string');
    }
    await this.getExpirationYearDropdown().click();
    await this.page.keyboard.type(expirationYear);
    await this.page.getByRole("option", { name: expirationYear }).click();
  }

  /**
   * Selects the country from the dropdown.
   * @param {string} country - Country name (required)
   * @throws {Error} If country is not provided
   */
  async typeCountry(country) {
    if (!country || typeof country !== 'string') {
      throw new Error('country must be a non-empty string');
    }
    await this.getCountryDropdown().click();
    await this.page.keyboard.type(country);
    await this.page.getByRole("option", { name: country }).click();
  }

  /**
   * Types the city name into the input.
   * @param {string} cityName
   */
  async typeCityName(cityName) {
    await this.page.fill(SELECTORS.CITY_NAME_INPUT, cityName);
  }

  /**
   * Types the zip code into the input.
   * @param {string} zipCode
   */
  async typeZipCode(zipCode) {
    await this.page.fill(SELECTORS.ZIP_CODE_INPUT, zipCode);
  }

  /**
   * Types the street name into the input.
   * @param {string} streetName
   */
  async typeStreetName(streetName) {
    await this.page.fill(SELECTORS.STREET_NAME_INPUT, streetName);
  }

  /**
   * Clicks the link to open the Insert Credit Card Number modal.
   */
  async clickInsertCreditCardNumberLink() {
    await this.page.click(SELECTORS.INSERT_CREDIT_CARD_NUMBER_LINK);
  }

  /**
   * Waits for the Save Card button to be visible in the modal.
   */
  async waitForSaveCardModalButton() {
    const button = this.page.locator(SELECTORS.SAVE_CARD_MODAL_BUTTON);
    await button.waitFor({ state: "visible" });
  }

  /**
   * Clicks the Save Card button in the modal.
   */
  async clickSaveCardModalButton() {
    await this.page.click(SELECTORS.SAVE_CARD_MODAL_BUTTON);
  }

  /**
   * Types the card number into the modal field.
   * @param {string} cardNumber - Card number (required)
   * @throws {Error} If cardNumber is not provided
   */
  async typeCardNumberInModal(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      throw new Error('cardNumber must be a non-empty string');
    }
    await this.page.fill(SELECTORS.INSERT_CREDIT_CARD_NUMBER_FIELD, cardNumber);
  }

  /**
   * Clicks the Save Card button.
   */
  async clickSaveCardButton() {
    await this.page.click(SELECTORS.SAVE_CARD);
  }

  /**
   * Closes the FOP (Form of Payment) modal.
   *
   * Note: Uses nth(6) because multiple nested dialogs exist on the page
   * and this targets the specific FOP modal close button.
   */
  async closeFOPModal() {
    await this.page.getByRole("button", { name: "Close this dialog" }).nth(6).click();
  }

  /**
   * Waits for the green payment confirmation icon to be visible in the cart.
   */
  async waitForGreenIconInCart() {
    const icon = this.page.locator(SELECTORS.GREEN_ICON_CART);
    await icon.waitFor({ state: "visible" });
  }

  /**
   * Clicks the back arrow button.
   */
  async clickBackArrow() {
    await this.page.locator(SELECTORS.BACK_ARROW).click();
  }
}

// Export CartPaymentPage
module.exports = CartPaymentPage;