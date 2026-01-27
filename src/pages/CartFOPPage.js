
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
  ADD_CARD_DETAILS_BUTTON: ".add-credit",
  DROPDOWN_FIELDS: ".el-select__wrapper",
  CARD_HOLDER_NAME_INPUT: '[placeholder="Card holder name"]',
  CITY_NAME_INPUT: '[placeholder="City name"]',
  ZIP_CODE_INPUT: '[placeholder="Zip code"]',
  STREET_NAME_INPUT: '[placeholder="Street name"]',
  INSERT_CREDIT_CARD_NUMBER_LINK: '.insertCard',
  SAVE_CARD: '.btn-save',
  // Dropdown option builder
  DROPDOWN_OPTION: (option) => `li.el-select-dropdown__item span:text("${option}")`,
  // "Insert Credit Card Number" modal selectors
  INSERT_CREDIT_CARD_NUMBER_FIELD: '[placeholder="Please enter your credit card number"]',
  SAVE_CARD_MODAL_BUTTON: '.btn.flex button.btn.btn--primary.btn--size-default.btn--round',
};

class CartFOPPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the button to open the Add Card Details modal.
   */
  async clickAddCardDetailsButton() {
    await this.page.click(SELECTORS.ADD_CARD_DETAILS_BUTTON);
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
    const dropdowns = this.page.locator(SELECTORS.DROPDOWN_FIELDS);
    await dropdowns.nth(0).click();
    await dropdowns.nth(0).fill(cardType);
  }

  /**
   * Clicks the card type option in the dropdown.
   * @param {string} cardType
   */
  async clickCardTypeDropdownOption(cardType) {
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(cardType)).click();
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
    const dropdowns = this.page.locator(SELECTORS.DROPDOWN_FIELDS);
    await dropdowns.nth(1).click();
    await dropdowns.nth(1).fill(expirationMonth);
  }

  /**
   * Clicks the expiration month option in the dropdown.
   * @param {string} expirationMonth
   */
  async clickExpirationMonthDropdownOption(expirationMonth) {
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(expirationMonth)).click();
  }

  /**
   * Selects the expiration year from the dropdown.
   * @param {string} expirationYear
   */
  async typeExpirationYear(expirationYear) {
    const dropdowns = this.page.locator(SELECTORS.DROPDOWN_FIELDS);
    await dropdowns.nth(2).click();
    await dropdowns.nth(2).fill(expirationYear);
  }

  /**
   * Clicks the expiration year option in the dropdown.
   * @param {string} expirationYear
   */
  async clickExpirationYearDropdownOption(expirationYear) {
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(expirationYear)).click();
  }

  /**
   * Selects the country from the dropdown.
   * @param {string} country
   */
  async typeCountry(country) {
    const dropdowns = this.page.locator(SELECTORS.DROPDOWN_FIELDS);
    await dropdowns.nth(3).click();
    await dropdowns.nth(3).fill(country);
  }

  /**
   * Clicks the country option in the dropdown.
   * @param {string} country
   */
  async clickCountryDropdownOption(country) {
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(country)).click();
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
}

// Export CartFOPPage
module.exports = CartFOPPage;