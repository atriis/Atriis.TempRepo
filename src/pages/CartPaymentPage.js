/**
 * Page Object for cart payment page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // CVV input field selector
  CVV_INPUT: "[placeholder='cvv']",
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
  PAYMENT_RESTRICTION_LABEL: ".label",
  PAYMENT_RESTRICTION_CONTROL: ".control span",
  // "Set Billback" button shown when isBillBack is true and billback info is not yet complete
  SET_BILLBACK_BUTTON: '.add-form-payment',
  // Add card button (hidden when canSelectFop is false = no other CC privilege)
  ADD_CARD_BUTTON: ".add-card .add-credit",
  // Billback checkbox container
  BILLBACK_CHECKBOX_CONTAINER: ".billback-checkbox-container",
  BILLBACK_CHECKBOX: ".billback-checkbox-container .el-checkbox",
  // Payment method extras section (booking.com)
  PAYMENT_METHOD_SECTION: ".quote-extras--payment-method",
  PAYMENT_METHOD_RADIO: ".quote-extras--payment-method .el-radio",
  PAYMENT_METHOD_SAVE_BTN: ".quote-extras--payment-method .no-border",
  PAYMENT_RESTRICTIONS_CONTAINER: ".payment-restrictions-container",
  PAYMENT_RESTRICTIONS_LABEL: ".payment-restrictions-container .app-label.grayed",

  // Card selection panel
  CARD_CHECKBOX: ".select-credit-card .checkbox-round",
  CARD_NAME_DISABLED: ".card-name.gray-out",

  // Billback inner checkbox input (used to check `is-checked` class)
  BILLBACK_CHECKBOX_INPUT: '.el-checkbox__input',

  // Element UI checkbox or radio container — used to find a selectable payment item by its label text.
  EL_CHECKBOX_OR_RADIO: '.el-checkbox, .el-radio',
  // Inner input wrapper inside an el-checkbox/el-radio that carries the `is-checked` class.
  EL_CHECKBOX_OR_RADIO_INPUT: '.el-checkbox__input, .el-radio__input',

  // Card wrapper used by the select-credit-card dialog. Each available card is rendered as
  // `el-card.box-card`, and the wrapper gains the `selected-card` class when chosen.
  // Used by name-based selection helpers as a fallback when no checkbox/radio matches the card name.
  SELECT_CREDIT_CARD_BOX: '.box-card',

  // Button names (used with getByRole)
  ADD_PAYMENT_METHOD_BTN_NAME: "Add payment method",
  ADD_CARD_DETAILS_BTN_NAME: "Add card details",
  CLOSE_DIALOG_BTN_NAME: "Close this dialog",

  // Missing card details flow
  COMPLETE_MISSING_INFO_BTN: '.missing-card-btn',
  FORM_PAYMENT_ERR: '.form-payment-err',
  SELECTED_CARD_SECTION_TITLE: '.selected-card .section-title',
  SELECTED_CARD_SAVE_BTN: '.selected-card .btn',
  SELECTED_CARD_CARD_NAME: '.selected-card .card-name',
  MISSING_CARD_DETAILS_LABEL: '.missing-card-details .label',
  MISSING_CARD_DETAILS_INPUT_DANGER: '.missing-card-details .is-danger',
  MISSING_CARD_DETAILS_COUNTRY_SELECT: '.missing-card-details .el-select',
  MISSING_CARD_DETAILS_COUNTRY_OPTION: '.el-select-dropdown__item',
  // Card holder name input inside the missing-card-details el-input (no placeholder)
  MISSING_CARD_HOLDER_NAME_INPUT: '.missing-card-details .el-input input',
  // Displayed card holder name shown on the cart form-of-payment row (next to CVV / last 4 digits)
  DISPLAYED_CARD_HOLDER_NAME: '.credit-card .card-name',
  EDIT_CARD_LINK: '.edit-payment-btn .is-clickable',
  LAST_FOUR_DIGIT: '.last-four-digit',
  NO_COUNTRY_CARD_CHECKBOX: '.select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(2) [type="checkbox"]',
  // Items inside the currently-visible el-select dropdown popper panel.
  // Element Plus teleports poppers to <body>; :visible scopes to the active one.
  VISIBLE_DROPDOWN_ITEM: '.el-select-dropdown:visible .el-select-dropdown__item',
  // Scrollable wrapper inside the currently-visible el-select-dropdown panel.
  VISIBLE_DROPDOWN_SCROLL_WRAP: '.el-select-dropdown:visible .el-scrollbar__wrap',
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
   * Gets the list of available cards.
   * @returns {import('@playwright/test').Locator}
   */
  getCardList() {
    return this.page.locator(SELECTORS.CARD_NAME_LIST);
  }

  /**
   * Returns the count of visible cards in the card list.
   * @returns {Promise<number>}
   */
  async getCardCount() {
    await this.page.locator(SELECTORS.CARD_NAME_LIST).first().waitFor({ state: 'visible' });
    return await this.page.locator(SELECTORS.CARD_NAME_LIST).count();
  }

  /**
   * Waits for the Card Details section to be visible.
   */
  async waitForCardDetailsToBeVisible() {
    await this.getCardDetailsTitle().waitFor({ state: 'visible' });
  }

  /**
   * Clicks the button to open the Add Payment Method modal.
   * In flows with multiple form-of-payment blocks (e.g. Sabre Separate Tickets),
   * the DOM exposes one "Add payment method" button per ticket. Scope to the
   * first match to avoid strict-mode violations; callers that need to act on
   * a subsequent block should add a dedicated helper.
   */
  async clickAddPaymentMethodButton() {
    const button = this.page.getByRole("button", { name: SELECTORS.ADD_PAYMENT_METHOD_BTN_NAME }).first();
    await button.waitFor({ state: "visible", timeout: 30000 });
    await button.click({ timeout: 30000 });
  }

  /**
   * Clicks the button to open the Add Card Details modal.
   */
  async clickAddCardDetailsButton() {
    const button = this.page.getByRole("button", { name: SELECTORS.ADD_CARD_DETAILS_BTN_NAME });
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
   * Reads the displayed card holder name shown on the cart form-of-payment
   * row (rendered next to the CVV input and last-four-digits in "Pending
   * booking" state). This is a text span, not an input.
   * @returns {Promise<string>} The trimmed text of the displayed card holder name
   */
  async getDisplayedCardHolderName() {
    const nameNode = this.page.locator(SELECTORS.DISPLAYED_CARD_HOLDER_NAME).first();
    await nameNode.waitFor({ state: "visible", timeout: 30000 });
    const text = await nameNode.textContent();
    return (text || "").trim();
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
   * Closes the FOP (Form of Payment) modal by index.
   * Returns false silently if the modal close button is not found (optional modal).
   *
   * Note: Uses index because multiple nested dialogs exist on the page.
   * Pass the correct nth index to target the specific FOP modal close button.
   * @param {number} nth - Index of the close button (default: 1 for most cases)
   * @returns {Promise<boolean>} True if modal was closed, false if button not found
   */
  async closeFOPModal(nth = 1) {
    try {
      const closeBtn = this.page.getByRole("button", { name: SELECTORS.CLOSE_DIALOG_BTN_NAME }).nth(nth);
      // Wait briefly to see if the button exists, then click
      await closeBtn.waitFor({ state: "visible", timeout: 5000 });
      await closeBtn.click();
      return true;
    } catch (error) {
      // Modal not found or already closed - this is OK for optional modals
      return false;
    }
  }

  /**
   * Waits for the green payment confirmation icon to be visible in the cart.
   */
  async waitForGreenIconInCart() {
    const icon = this.page.locator(SELECTORS.GREEN_ICON_CART);
    await icon.waitFor({ state: "visible" });
    return true;
  }

  /**
   * Clicks the back arrow button.
   */
  async clickBackArrow() {
    await this.page.locator(SELECTORS.BACK_ARROW).click();
  }

  /**
   * Fills the CVV field if it is visible, otherwise does nothing.
   * Used for payment flows where CVV may or may not be required.
   * Types slowly (100ms per character) to ensure field registration.
   * @param {string} cvv - CVV code (required)
   * @throws {Error} If cvv is not provided
   * @returns {Promise<void>}
   */
  async fillCVV(cvv) {
    if (!cvv || typeof cvv !== 'string') {
      throw new Error('cvv must be a non-empty string');
    }

    const cvvInputs = this.page.locator(SELECTORS.CVV_INPUT);
    const totalInputs = await cvvInputs.count();

    for (let index = 0; index < totalInputs; index += 1) {
      const cvvInput = cvvInputs.nth(index);
      if (!(await cvvInput.isVisible().catch(() => false))) {
        continue;
      }

      await cvvInput.scrollIntoViewIfNeeded().catch(() => {});
      await cvvInput.click();
      await cvvInput.clear();
      await cvvInput.fill('');
      await cvvInput.type(cvv, { delay: 100 });
    }
  }

  /**
   * Clicks the round checkbox for a specific saved card by card name.
   * @param {string} cardName
   */
  async clickCardCheckboxByName(cardName) {
    if (!cardName || typeof cardName !== "string") {
      throw new Error("cardName must be a non-empty string");
    }

    const cardNames = this.getCardList();
    await cardNames.first().waitFor({ state: "visible", timeout: 20000 });

    const total = await cardNames.count();
    let targetIndex = -1;

    for (let i = 0; i < total; i += 1) {
      const text = (await cardNames.nth(i).innerText()).trim().toLowerCase();
      if (text.includes(cardName.trim().toLowerCase())) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex < 0) {
      throw new Error(`Could not find card by name: ${cardName}`);
    }

    const checkboxes = this.page.locator(SELECTORS.CARD_CHECKBOX);
    await checkboxes.nth(targetIndex).waitFor({ state: "visible", timeout: 20000 });
    await checkboxes.nth(targetIndex).click();
  }

  /**
   * Waits for payment restriction label text to be visible.
   */
  async waitForPaymentRestrictionLabel() {
    const label = this.page.locator(SELECTORS.PAYMENT_RESTRICTION_LABEL).filter({ hasText: "Payment restriction" }).first();
    await label.waitFor({ state: "visible", timeout: 20000 });
  }

  /**
   * Opens the payment restriction options dropdown.
   */
  async clickPaymentRestrictionControl() {
    const control = this.page.locator(SELECTORS.PAYMENT_RESTRICTION_CONTROL).first();
    await control.waitFor({ state: "visible", timeout: 20000 });
    await control.click();
  }

  /**
   * Checks whether a card row appears disabled (greyed-out / not-supported state).
   * In the UI, unsupported cards get the "gray-out" class on the .card-name element.
   * @param {string} cardName
   * @returns {Promise<boolean>} true if the card looks disabled
   */
  async isCardDisabled(cardName) {
    if (!cardName || typeof cardName !== 'string') {
      throw new Error('cardName must be a non-empty string');
    }

    const cardNameEl = this.page.locator(SELECTORS.CARD_NAME_DISABLED).filter({ hasText: cardName }).first();
    const isGrayedOut = await cardNameEl.isVisible({ timeout: 5000 }).catch(() => false);

    return isGrayedOut;
  }

  /**
   * Returns locator for a payment restriction option by visible text.
   * @param {string} option
   * @returns {import('@playwright/test').Locator}
   */
  getPaymentRestrictionOption(option) {
    if (!option || typeof option !== "string") {
      throw new Error("option must be a non-empty string");
    }

    return this.page.getByText(option, { exact: false }).first();
  }

  /**
   * Clicks the "Set Billback" button in the form-of-payment section.
   * Shown when isBillBack is true and billback info is not yet complete.
   */
  async clickSetBillbackButton() {
    const btn = this.page.locator(SELECTORS.SET_BILLBACK_BUTTON);
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Checks if the "Add card" button is visible (indicates user has CC privilege).
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isAddCardButtonVisible({ timeout = 5000 } = {}) {
    const btn = this.page.locator(SELECTORS.ADD_CARD_BUTTON).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the billback checkbox is visible.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isBillbackCheckboxVisible({ timeout = 10000 } = {}) {
    const checkbox = this.page.locator(SELECTORS.BILLBACK_CHECKBOX).first();
    try {
      await checkbox.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the billback checkbox is checked.
   * @returns {Promise<boolean>}
   */
  async isBillbackCheckboxChecked() {
    const checkbox = this.page.locator(SELECTORS.BILLBACK_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    return checkbox.locator(SELECTORS.BILLBACK_CHECKBOX_INPUT).evaluate(el => el.classList.contains('is-checked'));
  }

  /**
   * Checks if a card's checkbox is checked, found by matching the card name string.
   * Works for any .el-checkbox container whose visible text contains cardName.
   * @param {string} cardName - Substring to match against card label text
   * @returns {Promise<boolean>}
   */
  async isCardCheckboxCheckedByName(cardName) {
    if (!cardName || typeof cardName !== 'string') {
      throw new Error('[CartPaymentPage.isCardCheckboxCheckedByName] "cardName" must be a non-empty string, got: ' + typeof cardName + ' (' + JSON.stringify(cardName) + ')');
    }

    // Prefer the most specific selectable element first: an el-checkbox or el-radio
    // whose own text matches cardName (this preserves legacy behavior for billback and radio flows).
    // Only fall back to the select-credit-card `.box-card` wrapper if no checkbox/radio matches,
    // because in that dialog the card itself carries the `selected-card` class and contains no
    // checkbox/radio whose text matches the card name directly.
    const checkboxOrRadio = this.page.locator(SELECTORS.EL_CHECKBOX_OR_RADIO).filter({ hasText: cardName }).first();
    if (await checkboxOrRadio.count() > 0) {
      try {
        await checkboxOrRadio.waitFor({ state: 'visible', timeout: 10000 });
      } catch (err) {
        throw new Error(`[CartPaymentPage.isCardCheckboxCheckedByName] Found a checkbox/radio labeled "${cardName}" but it never became visible within 10s. Original: ${err.message}`);
      }
      return checkboxOrRadio.locator(SELECTORS.EL_CHECKBOX_OR_RADIO_INPUT).first().evaluate(el => el.classList.contains('is-checked'));
    }

    // Fallback: select-credit-card dialog — each card is `.box-card`, marked with `.selected-card` when chosen.
    const card = this.page.locator(SELECTORS.SELECT_CREDIT_CARD_BOX).filter({ hasText: cardName }).first();
    try {
      await card.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(`[CartPaymentPage.isCardCheckboxCheckedByName] Could not find a selectable payment item (checkbox, radio, or card box) labeled "${cardName}" within 10s. Likely the Add Payment Method dialog is not open or the card label changed. Original: ${err.message}`);
    }
    return card.evaluate(el => el.classList.contains('selected-card'));
  }

  /**
   * Clicks the billback checkbox.
   */
  async clickBillbackCheckbox() {
    const checkbox = this.page.locator(SELECTORS.BILLBACK_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    await checkbox.click();
  }

  /**
   * Checks if a payment method radio option is visible by text.
   * @param {string} optionText - The radio option text (e.g., "Pay on departure")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isPaymentMethodOptionVisible(optionText, { timeout = 10000 } = {}) {
    const radio = this.page.locator(SELECTORS.PAYMENT_METHOD_RADIO).filter({ hasText: optionText }).first();
    try {
      await radio.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks a payment method radio option by text.
   * @param {string} optionText - The radio option text (e.g., "Pay on departure")
   */
  async clickPaymentMethodOption(optionText) {
    if (!optionText || typeof optionText !== 'string') {
      throw new Error('optionText must be a non-empty string');
    }
    const radio = this.page.locator(SELECTORS.PAYMENT_METHOD_RADIO).filter({ hasText: optionText }).first();
    await radio.waitFor({ state: 'visible', timeout: 10000 });
    await radio.click();
  }

  /**
   * Clicks the Save button in the payment method section.
   */
  async clickPaymentMethodSaveButton() {
    const btn = this.page.locator(SELECTORS.PAYMENT_METHOD_SAVE_BTN).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Checks if payment restrictions container is visible.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isPaymentRestrictionsContainerVisible({ timeout = 10000 } = {}) {
    const container = this.page.locator(SELECTORS.PAYMENT_RESTRICTIONS_CONTAINER).first();
    try {
      await container.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets all payment restriction label texts.
   * @returns {Promise<string[]>}
   */
  async getPaymentRestrictionLabels() {
    const labels = this.page.locator(SELECTORS.PAYMENT_RESTRICTIONS_LABEL);
    const count = await labels.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      texts.push((await labels.nth(i).textContent()).trim());
    }
    return texts;
  }

  // ===== Missing card info flow =====

  /**
   * Checks if the "Complete missing info" button is visible on a card.
   * @returns {Promise<boolean>}
   */
  async isCompleteMissingInfoButtonVisible() {
    const btn = this.page.locator(SELECTORS.COMPLETE_MISSING_INFO_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the "Complete missing info" button to open the card edit form.
   */
  async clickCompleteMissingInfoButton() {
    const btn = this.page.locator(SELECTORS.COMPLETE_MISSING_INFO_BTN).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Gets the visible text of the "In order to proceed" payment error message.
   * @returns {Promise<string|null>} text content or null if not visible
   */
  async getFormPaymentErrorText() {
    const el = this.page.locator(SELECTORS.FORM_PAYMENT_ERR).first();
    try {
      await el.waitFor({ state: 'visible', timeout: 10000 });
      return (await el.textContent()).trim();
    } catch {
      return null;
    }
  }

  /**
   * Checks if the "In order to proceed" payment error message is visible.
   * @returns {Promise<boolean>}
   */
  async isFormPaymentErrorVisible() {
    const el = this.page.locator(SELECTORS.FORM_PAYMENT_ERR).first();
    try {
      await el.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the "In order to proceed" payment error message is hidden/gone.
   * @returns {Promise<boolean>}
   */
  async isFormPaymentErrorHidden() {
    const el = this.page.locator(SELECTORS.FORM_PAYMENT_ERR).first();
    try {
      await el.waitFor({ state: 'hidden', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the "Missing details" section title text from the selected card form.
   * @returns {Promise<string|null>}
   */
  async getSelectedCardSectionTitle() {
    const el = this.page.locator(SELECTORS.SELECTED_CARD_SECTION_TITLE).first();
    try {
      await el.waitFor({ state: 'visible', timeout: 10000 });
      return (await el.textContent()).trim();
    } catch {
      return null;
    }
  }

  /**
   * Gets all label texts from the missing card details form.
   * @returns {Promise<string[]>}
   */
  async getMissingCardDetailsLabels() {
    const labels = this.page.locator(SELECTORS.MISSING_CARD_DETAILS_LABEL);
    await labels.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await labels.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      texts.push((await labels.nth(i).textContent()).trim());
    }
    return texts;
  }

  /**
   * Clicks the "Save" button in the selected card form (missing card details form).
   */
  async clickSelectedCardSaveButton() {
    const btn = this.page.locator(SELECTORS.SELECTED_CARD_SAVE_BTN).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Checks if a validation error (is-danger) is shown in the missing card details form.
   * @returns {Promise<boolean>}
   */
  async isValidationErrorVisible() {
    const el = this.page.locator(SELECTORS.MISSING_CARD_DETAILS_INPUT_DANGER).first();
    try {
      await el.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fills the card holder name field in the missing card details form.
   * Uses the input inside .missing-card-details .el-input (no placeholder attribute).
   * @param {string} name
   */
  async fillMissingCardHolderName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('name must be a non-empty string');
    }
    const input = this.page.locator(SELECTORS.MISSING_CARD_HOLDER_NAME_INPUT).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(name);
  }

  /**
   * Clicks the edit card link in the trip overview (ticket top section).
   */
  async clickEditCardLink() {
    const link = this.page.locator(SELECTORS.EDIT_CARD_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 10000 });
    await link.click();
  }

  /**
   * Clicks the checkbox for the "no country" card (second card in the first group).
   */
  async clickNoCountryCardCheckbox() {
    const checkbox = this.page.locator(SELECTORS.NO_COUNTRY_CARD_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    await checkbox.click();
  }

  /**
   * Opens the expiration year dropdown by clicking it (without selecting any value).
   * Leaves the dropdown panel open so its items can be inspected.
   */
  async openExpirationYearDropdown() {
    const dropdown = this.getExpirationYearDropdown();
    try {
      await dropdown.waitFor({ state: 'visible', timeout: 15000 });
      await dropdown.click();
      // Wait for the dropdown panel to actually appear after clicking
      await this.page.locator(SELECTORS.VISIBLE_DROPDOWN_ITEM).first()
        .waitFor({ state: 'visible', timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[CartPaymentPage.openExpirationYearDropdown] Could not open the expiration year dropdown. ` +
        `The "Add card details" form may not be open yet, or the dropdown was not found within 15s. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Counts ALL dropdown items whose text starts with the given prefix by hovering and scrolling
   * through the dropdown panel. Element UI renders only ~8 items in the viewport at once inside
   * an overflow-scroll container — this method scrolls from top to bottom, accumulating unique
   * item texts until no new ones appear, then returns the count of matching items.
   * Assumes a dropdown panel is already open.
   * @param {string} prefix - Text prefix to match (e.g. '2')
   * @returns {Promise<number>} Number of matching items
   */
  async countOpenDropdownItemsStartingWith(prefix) {
    if (!prefix || typeof prefix !== 'string') {
      throw new Error(
        `[CartPaymentPage.countOpenDropdownItemsStartingWith] "prefix" must be a non-empty string, got: ${typeof prefix}`
      );
    }

    // Element Plus teleports dropdown popper panels to <body>. Multiple hidden panels exist
    // from various el-select components. Use :visible-scoped selectors for the active panel.
    const visibleItems = this.page.locator(SELECTORS.VISIBLE_DROPDOWN_ITEM);
    let panelAlreadyOpen = await visibleItems.first().isVisible().catch(() => false);

    if (!panelAlreadyOpen) {
      // The dropdown may have closed between Cucumber steps — re-open with retry
      try {
        await this.openExpirationYearDropdown();
        panelAlreadyOpen = true;
      } catch (err) {
        throw new Error(
          `[CartPaymentPage.countOpenDropdownItemsStartingWith] Could not open the expiration year dropdown. ` +
          `Original: ${err.message}`
        );
      }
    }

    // Locate the visible dropdown's scrollable wrapper
    const scrollWrap = this.page.locator(SELECTORS.VISIBLE_DROPDOWN_SCROLL_WRAP);
    await scrollWrap.scrollIntoViewIfNeeded();
    await scrollWrap.hover();

    // Reset to top
    await scrollWrap.evaluate(el => { el.scrollTop = 0; });
    await this.page.waitForTimeout(100);

    // Scroll through, collecting all unique item texts until no new items appear.
    const allTexts = new Set();
    let previousSize = -1;
    while (allTexts.size !== previousSize) {
      previousSize = allTexts.size;
      const texts = await visibleItems.allTextContents();
      texts.forEach(t => allTexts.add(t.trim()));
      await scrollWrap.evaluate(el => { el.scrollTop += 300; });
      await this.page.waitForTimeout(150);
    }

    return [...allTexts].filter(t => t.startsWith(prefix)).length;
  }

  /**
   * Selects the first available country in the country dropdown in the missing card details form.
   */
  async selectFirstCountryInDropdown() {
    const dropdown = this.page.locator(SELECTORS.MISSING_CARD_DETAILS_COUNTRY_SELECT).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    await dropdown.click();
    const firstOption = this.page.locator(SELECTORS.MISSING_CARD_DETAILS_COUNTRY_OPTION).first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();
  }

  /**
   * Clicks the round checkbox for a saved card by its 1-based index.
   * @param {number} index - 1-based index of the card to select
   */
  async clickCardCheckboxByIndex(index) {
    if (typeof index !== 'number' || index < 1) {
      throw new Error(`index must be >= 1, got: ${index}`);
    }
    const checkboxes = this.page.locator(SELECTORS.CARD_CHECKBOX);
    await checkboxes.first().waitFor({ state: 'visible', timeout: 20000 });
    const total = await checkboxes.count();
    if (index > total) {
      throw new Error(`Card index ${index} out of range. Only ${total} cards available.`);
    }
    await checkboxes.nth(index - 1).click();
  }

  /**
   * Checks whether the CVV input field is currently visible.
   * @param {object} [options]
   * @param {number} [options.timeout=3000]
   * @returns {Promise<boolean>}
   */
  async isCVVFieldVisible({ timeout = 3000 } = {}) {
    try {
      await this.page.locator(SELECTORS.CVV_INPUT).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets all card name texts from the card list.
   * @returns {Promise<string[]>}
   */
  async getAllCardNames() {
    const cards = this.page.locator(SELECTORS.CARD_NAME_LIST);
    await cards.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await cards.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      names.push((await cards.nth(i).textContent()).trim());
    }
    return names;
  }

  /**
   * Gets the trimmed text content of the last-four-digit element in the FOP section.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>}
   */
  async getLastFourDigitText({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.LAST_FOUR_DIGIT).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.textContent()).trim();
  }
}

// Export CartPaymentPage
module.exports = CartPaymentPage;