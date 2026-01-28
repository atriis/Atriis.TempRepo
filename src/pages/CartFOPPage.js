
/**
 * CartFOPPage
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
  CARD_HOLDER_NAME_INPUT: '[placeholder="Card holder name"]',
  CITY_NAME_INPUT: '[placeholder="City name"]',
  ZIP_CODE_INPUT: '[placeholder="Zip code"]',
  STREET_NAME_INPUT: '[placeholder="Street name"]',
  INSERT_CREDIT_CARD_NUMBER_LINK: '.insertCard',
  SAVE_CARD: '.btn-save',
  // "Insert Credit Card Number" modal selectors
  INSERT_CREDIT_CARD_NUMBER_FIELD: '[placeholder="Please enter your credit card number"]',
  SAVE_CARD_MODAL_BUTTON: '.btn.flex button.btn.btn--primary.btn--size-default.btn--round',
  // Green icon cart
  GREEN_ICON_CART: '.material-symbols-outlined.payment-status-icon.filled.green'
};

class CartFOPPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the button to open the Add Payment Method modal.
   */
  async clickAddPaymentMethodButton() {
    const button = this.page.getByRole('button', { name: 'Add payment method' });
    await button.waitFor({ state: 'visible' });
    await button.click();
  }

  /**
   * Clicks the button to open the Add Card Details modal.
   */
  async clickAddCardDetailsButton() {
    const button = this.page.getByRole('button', { name: 'Add card details' });
    await button.waitFor({ state: 'visible' });
    await button.click();
  }

  /**
   * Waits for the Card Holder Name input to be visible in the modal.
   */
  async waitForCardHolderNameInput() {
    const input = this.page.locator(SELECTORS.CARD_HOLDER_NAME_INPUT).first();
    await input.waitFor({ state: 'visible' });
  }

  /**
   * Selects the card type from the dropdown.
   * @param {string} cardType
   */
  async typeCardType(cardType) {
    const select = this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(0);
    await select.click();
    await this.page.keyboard.type(cardType);
    await this.page.getByRole('option', { name: cardType }).click();
  }

  /**
   * Types the card holder name into the input.
   * @param {string} name
   */
  async typeCardHolderName(name) {
    await this.page.fill(SELECTORS.CARD_HOLDER_NAME_INPUT, name);
  }

  /**
   * Selects the expiration month from the dropdown.
   * @param {string} expirationMonth
   */
  async typeExpirationMonth(expirationMonth) {
    const select = this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(1);
    await select.click();
    await this.page.keyboard.type(expirationMonth);
    await this.page.getByRole('option', { name: expirationMonth }).click();
  }

  /**
   * Selects the expiration year from the dropdown.
   * @param {string} expirationYear
   */
  async typeExpirationYear(expirationYear) {
    const select = this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(2);
    await select.click();
    await this.page.keyboard.type(expirationYear);
    await this.page.getByRole('option', { name: expirationYear }).click();
  }

  /**
   * Selects the country from the dropdown.
   * @param {string} country
   */
  async typeCountry(country) {
    const select = this.page.locator(SELECTORS.DROPDOWN_WRAPPER).nth(3);
    await select.click();
    await this.page.keyboard.type(country);
    await this.page.getByRole('option', { name: country }).click();
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
    await button.waitFor({ state: 'visible' });
  }

  /**
   * Clicks the Save Card button in the modal.
   */
  async clickSaveCardModalButton() {
    await this.page.click(SELECTORS.SAVE_CARD_MODAL_BUTTON);
  }

  /**
   * Types the card number into the modal field.
   * @param {string} cardNumber
   */
  async typeCardNumberInModal(cardNumber) {
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
   */
  async closeFOPModal() {
    await this.page.getByRole('button', { name: 'Close this dialog' }).nth(6).click();
  }

  /**
   * Waits for the green payment confirmation icon to be visible in the cart.
   */
  async waitForGreenIconInCart() {
    const icon = this.page.locator(SELECTORS.GREEN_ICON_CART);
    await icon.waitFor({ state: 'visible' });
  }
}

// Export CartFOPPage
module.exports = CartFOPPage;