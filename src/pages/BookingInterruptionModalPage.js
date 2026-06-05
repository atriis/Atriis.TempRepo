const SELECTORS = {
  MODAL: '.el-dialog.app-dialog',
  MODAL_FOOTER: '.el-dialog__footer',

  // All field container types used by the reference-field questionnaire
  FIELD_CONTAINERS: '.input-dropdown, .input-textbox, .input-textarea, .input-checkbox, .input-autocomplete',

  // Required field indicator — red asterisk rendered by each input component
  REQUIRED_MARKER: 'span.has-text-danger',

  // Financial reference section (inside an el-collapse panel in the modal)
  FINANCIAL_REF: '.financial-reference',
  FINANCIAL_CARET: '.el-select__caret',

  // Collapse panels that might hide sections until expanded
  COLLAPSE_HEADER_INACTIVE: '.el-collapse-item__header:not(.is-active)',

  // Atomic input elements inside each field container
  EL_SELECT_TRIGGER: '.el-select',
  EL_INPUT: '.el-input__inner',
  EL_TEXTAREA: '.el-textarea__inner',
  CHECKBOX: 'input[type="checkbox"]',

  // Dropdown list option (teleported to <body> by Element Plus)
  DROPDOWN_OPTION: '.el-select-dropdown__item:not(.is-disabled)',
};

class BookingInterruptionModalPage {
  constructor(page) {
    this.page = page;
  }

  getModal() {
    return this.page.locator(SELECTORS.MODAL).first();
  }

  async isVisible(timeout = 300) {
    try {
      await this.getModal().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Expands any collapsed sections inside the modal so their fields are reachable.
   * The financial-reference section lives inside an el-collapse that starts closed.
   */
  async expandCollapsedSections() {
    const inactiveHeaders = this.getModal().locator(SELECTORS.COLLAPSE_HEADER_INACTIVE);
    const count = await inactiveHeaders.count();
    for (let i = 0; i < count; i++) {
      await inactiveHeaders.nth(i).click();
    }
  }

  /**
   * Returns all field containers inside the modal that are marked as required
   * (i.e. contain a span.has-text-danger asterisk).
   */
  getRequiredFieldContainers() {
    return this.getModal()
      .locator(SELECTORS.FIELD_CONTAINERS)
      .filter({ has: this.page.locator(SELECTORS.REQUIRED_MARKER) });
  }

  getFinancialReferenceSection() {
    return this.getModal().locator(SELECTORS.FINANCIAL_REF).first();
  }

  async isFinancialReferenceSectionVisible() {
    try {
      return await this.getFinancialReferenceSection().isVisible();
    } catch {
      return false;
    }
  }

  async isFinancialReferenceRequired() {
    const marker = this.getFinancialReferenceSection().locator(SELECTORS.REQUIRED_MARKER);
    return (await marker.count()) > 0;
  }

  /**
   * Opens the financial reference el-select and picks the first available option.
   * The caret click pattern mirrors DynamicAndReferenceFieldsPage.openFinancialReferenceDropdown.
   */
  async fillFinancialReference() {
    try {
      await this.getFinancialReferenceSection()
        .locator(SELECTORS.FINANCIAL_CARET)
        .first()
        .click({ timeout: 5000 });
      const option = this.page.locator(SELECTORS.DROPDOWN_OPTION).first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
    } catch (err) {
      throw new Error(
        `[BookingInterruptionModalPage.fillFinancialReference] Could not select a financial reference option. ` +
        `The dropdown may have no enabled options or the section was not visible. Original: ${err.message}`
      );
    }
  }

  /**
   * Opens an el-select inside a field container and clicks the first enabled option.
   * @param {import('playwright').Locator} container
   */
  async fillDropdownField(container) {
    try {
      await container.locator(SELECTORS.EL_SELECT_TRIGGER).first().click({ timeout: 5000 });
      const option = this.page.locator(SELECTORS.DROPDOWN_OPTION).first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
    } catch (err) {
      throw new Error(
        `[BookingInterruptionModalPage.fillDropdownField] Could not select the first option in a required dropdown. ` +
        `The dropdown had no enabled options within 5s. Original: ${err.message}`
      );
    }
  }

  /**
   * Fills a text input with the given value, skipping already-filled inputs.
   * @param {import('playwright').Locator} container
   * @param {string} value
   */
  async fillTextField(container, value) {
    try {
      const input = container.locator(SELECTORS.EL_INPUT).first();
      const current = await input.inputValue().catch(() => '');
      if (!current) {
        await input.fill(value, { timeout: 5000 });
      }
    } catch (err) {
      throw new Error(
        `[BookingInterruptionModalPage.fillTextField] Could not fill a required text field. Original: ${err.message}`
      );
    }
  }

  /**
   * Fills a textarea with the given value, skipping already-filled ones.
   * @param {import('playwright').Locator} container
   * @param {string} value
   */
  async fillTextareaField(container, value) {
    try {
      const textarea = container.locator(SELECTORS.EL_TEXTAREA).first();
      const current = await textarea.inputValue().catch(() => '');
      if (!current) {
        await textarea.fill(value, { timeout: 5000 });
      }
    } catch (err) {
      throw new Error(
        `[BookingInterruptionModalPage.fillTextareaField] Could not fill a required textarea field. Original: ${err.message}`
      );
    }
  }

  /**
   * Checks a checkbox if it is not already checked.
   * @param {import('playwright').Locator} container
   */
  async checkCheckboxField(container) {
    try {
      const checkbox = container.locator(SELECTORS.CHECKBOX).first();
      const isChecked = await checkbox.isChecked().catch(() => false);
      if (!isChecked) {
        await checkbox.click({ timeout: 5000 });
      }
    } catch (err) {
      throw new Error(
        `[BookingInterruptionModalPage.checkCheckboxField] Could not check a required checkbox. Original: ${err.message}`
      );
    }
  }

  /**
   * Infers the fill strategy from the container's CSS class.
   * @param {import('playwright').Locator} container
   * @returns {Promise<'dropdown' | 'textbox' | 'textarea' | 'checkbox' | 'unknown'>}
   */
  async getFieldType(container) {
    const cls = (await container.getAttribute('class')) || '';
    if (cls.includes('input-dropdown') || cls.includes('input-autocomplete')) return 'dropdown';
    if (cls.includes('input-textarea')) return 'textarea';
    if (cls.includes('input-checkbox')) return 'checkbox';
    if (cls.includes('input-textbox')) return 'textbox';
    return 'unknown';
  }

  getProceedButton() {
    return this.page
      .locator(SELECTORS.MODAL_FOOTER)
      .getByRole('button', { name: /^(Proceed|Save|Continue|OK|Confirm|Submit)$/i })
      .first();
  }

  async clickProceed() {
    const btn = this.getProceedButton();
    try {
      await btn.waitFor({ state: 'visible', timeout: 5000 });
      await btn.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[BookingInterruptionModalPage.clickProceed] Could not click the modal submit button ` +
        `(Proceed / Save / Continue). No visible action button found in the modal footer within 5s — ` +
        `a validation error may be blocking submission. Original: ${err.message}`
      );
    }
  }

  async waitForModalToClose(timeout = 8000) {
    try {
      await this.getModal().waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[BookingInterruptionModalPage.waitForModalToClose] Booking interruption modal did not close within ` +
        `${timeout}ms after clicking Proceed — a required field may still be empty or validation failed. ` +
        `Original: ${err.message}`
      );
    }
  }
}

module.exports = BookingInterruptionModalPage;
