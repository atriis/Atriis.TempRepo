/**
 * Page Object for dynamic and reference fields page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  REFERENCE_FIELD_SECTION: '.general-section',
  TRAVELER_FIELD_SECTION: '.traveler-section',
  INPUT_WRAPPER: '.el-input__wrapper',
  INPUT_INNER: '.el-input__inner',
  SAVE_BUTTON_MODAL: '.el-dialog__footer button:has-text("Save")',
  FIELD_LABEL: 'label.label',
  FIELD_CONTAINER: '.input-dropdown, .input-textbox, .input-checkbox, .input-autocomplete, .input-textarea',
  DROPDOWN_DISABLED: '.el-select.is-disabled',
  INPUT_DISABLED: '.el-input.is-disabled',
  VALIDATION_ERROR: '.form-validation-msg .help',
  MANDATORY_MARKER: 'span.has-text-danger',
  // Financial reference modal (cart.financialReferenceModal) — el-select rendered
  // by financial-reference.vue inside the reference-form / financial-reference popup.
  FINANCIAL_REFERENCE_SECTION: '.financial-reference',
  FINANCIAL_REFERENCE_CARET: '.financial-reference .el-select__caret',
  FINANCIAL_REFERENCE_DROPDOWN_OPTION: '.el-select-dropdown__item:not(.is-disabled)',
  // Financial Reference section title in the reference-fields modal (trip-app.vue → .financial-section
  // collapse header). Renders $t('cart.financialReferenceModal.modalTitle') === "Financial Reference".
  FINANCIAL_REFERENCE_MODAL_TITLE: '.financial-section .el-collapse-item__header .has-text-weight-semibold',
};

class DynamicAndReferenceFieldsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets a locator for a dropdown field by name.
   * Dynamic because field names vary across different forms.
   *
   * @param {string} fieldName - The name attribute of the field.
   * @returns {Locator} Playwright locator for interacting with the field.
   */
  getDropdownField(fieldName) {
    return this.page.locator(`[name='${fieldName}']`);
  }

  /**
   * Gets a locator for a text field by index.
   *
   * @param {number} [index=0] - The index of the text field (default is first).
   * @returns {Locator} Playwright locator for the text field.
   */
  getTextFieldInput(index = 0) {
    return this.page.locator(".el-input__wrapper").nth(index).locator(".el-input__inner");
  }


  /**
   * Clicks the dropdown to open the list of options.
   *
   * @param {string} fieldName - The name attribute of the field to click.
   */
  async clickToOpenDropdown(fieldName) {
    await this.getDropdownField(fieldName).click();
  }

  /**
   * Gets a locator for a dropdown option by its visible name.
   *
   * @param {string} optionName - The visible text of the option.
   * @returns {Locator} Playwright locator for the option.
   */
  getDropdownOption(optionName) {
    return this.page.getByRole("option", { name: optionName });
  }

  /**
   * Scrolls to a text field by index.
   * Uses the same locator as getTextFieldInput for consistency.
   *
   * @param {number} [index=0] - The index of the text field to scroll to.
   * @returns {Promise<void>}
   */
  async scrollToTextField(index = 0) {
    const field = this.page.locator(".el-input__wrapper").nth(index);
    await field.waitFor({ state: "visible", timeout: 10000 });
    await field.scrollIntoViewIfNeeded();
  }

  /**
   * Waits for a dropdown option to appear.
   *
   * @param {string} optionName - The name of the option to wait for.
   */
  async waitForDropdownOption(optionName) {
    await this.getDropdownOption(optionName).waitFor({ state: "visible" });
  }

  /**
   * Selects a dropdown option by its visible name.
   *
   * @param {string} optionName - The name of the option to select.
   */
  async selectDropdownOption(optionName) {
    await this.getDropdownOption(optionName).click();
  }

  /**
   * Expands all collapsed per-traveler sections within the Travellers Reference Questions.
   * This is needed when there are multiple travelers — by default only the first is expanded.
   */
  async expandAllCollapsedTravelerSections() {
    const collapsedHeaders = this.page.locator('.traveler-section .el-collapse-item__header:not(.is-active)');
    const count = await collapsedHeaders.count();
    for (let i = 0; i < count; i++) {
      await collapsedHeaders.nth(i).click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Returns a locator for all dropdown fields matching the given name attribute.
   * Includes hidden elements (e.g. inside collapsed traveler sections).
   *
   * @param {string} fieldName - The name attribute of the fields.
   * @returns {Locator}
   */
  getAllDropdownFields(fieldName) {
    return this.page.locator(`[name='${fieldName}']`);
  }

  /**
   * Fills in a text field by index with the provided text.
   *
   * @param {string} text - The text to enter in the field.
   * @param {number} [index=0] - The index of the text field (default is first).
   * @param {boolean} [shouldScroll=true] - Whether to scroll to the field before filling (default is true).
   */
  async fillInTextField(text, index = 0, shouldScroll = true) {
    if (shouldScroll) {
      await this.scrollToTextField(index);
    }
    await this.getTextFieldInput(index).fill(text);
  }

  /**
   * Finds a reference field by its label text and fills it with a value.
   * Uses case-insensitive label matching to locate the field container,
   * then finds the input within the same article/section.
   *
   * @param {string} labelText - The visible label text (e.g. "ORDER NUMBER")
   * @param {string} value - The value to fill in
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<void>}
   */
  async fillReferenceFieldByLabel(labelText, value, { timeout = 10000 } = {}) {
    if (!labelText) throw new Error('labelText is required');
    if (value === undefined || value === null) throw new Error('value is required');

    // Find the label element containing the field name
    const label = this.page.locator(`text=${labelText}`).first();
    await label.waitFor({ state: 'visible', timeout });

    // Find the closest ancestor article that contains both the label and input
    const fieldContainer = label.locator('xpath=ancestor::article[1]');
    const input = fieldContainer.locator(SELECTORS.INPUT_INNER).first();

    // If no input found in article, try the next sibling approach
    const inputExists = await input.count();
    if (inputExists > 0) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
    } else {
      // Fallback: find input near the label
      const nearbyInput = label.locator('..').locator(SELECTORS.INPUT_INNER).first();
      await nearbyInput.scrollIntoViewIfNeeded();
      await nearbyInput.fill(value);
    }
  }

  /**
   * Checks if a field label containing the given text is visible.
   * @param {string} labelText - Text to search for in labels
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isFieldLabelVisible(labelText, { timeout = 10000 } = {}) {
    if (!labelText) throw new Error('labelText is required');

    // Prefer a label that matches labelText EXACTLY (ignoring the "*" mandatory marker and "info"
    // icon text the label concatenates) so an exact label like "Location" is not shadowed by a
    // longer label that contains it as a substring (e.g. "Location travel policy"). Fall back to a
    // substring match when no exact label exists (preserves partial-label callers).
    const exactMatches = this.page.locator(SELECTORS.FIELD_LABEL).filter({ hasText: exactFieldLabelRegex(labelText) });
    const label = (await exactMatches.count()) > 0
      ? exactMatches.first()
      : this.page.locator(SELECTORS.FIELD_LABEL).filter({ hasText: labelText }).first();
    try {
      await label.waitFor({ state: 'attached', timeout });
      await label.scrollIntoViewIfNeeded();
      await label.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolves the reference-field container for a label, preferring a container whose label matches
   * labelText EXACTLY (ignoring the "*" mandatory marker and "info" icon text) over a mere substring
   * match. This keeps an exact label like "Location" from resolving to a longer label that contains
   * it as a substring (e.g. "Location travel policy", which renders earlier in the DOM). Falls back
   * to the first substring match when no exact label exists, preserving partial-label callers.
   *
   * @param {string} labelText - The label text of the field
   * @returns {Promise<import('playwright').Locator>}
   */
  async fieldContainerByLabel(labelText) {
    const exactMatches = this.page.locator(SELECTORS.FIELD_CONTAINER).filter({
      has: this.page.locator(SELECTORS.FIELD_LABEL).filter({ hasText: exactFieldLabelRegex(labelText) }),
    });
    if ((await exactMatches.count()) > 0) {
      return exactMatches.first();
    }
    return this.page.locator(SELECTORS.FIELD_CONTAINER).filter({ hasText: labelText }).first();
  }

  /**
   * Checks if a dropdown or input field identified by label text is disabled.
   * Looks for the el-select or el-input inside the same field container.
   * @param {string} labelText - The label text of the field
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   * @returns {Promise<boolean>} True if the field is disabled
   */
  async isFieldDisabled(labelText, { timeout = 5000 } = {}) {
    const fieldContainer = await this.fieldContainerByLabel(labelText);
    await fieldContainer.waitFor({ state: 'visible', timeout });
    // Check for disabled dropdown (Element Plus 1.x: .is-disabled, 2.x: is-disabled class on wrapper)
    const disabledDropdown = fieldContainer.locator(SELECTORS.DROPDOWN_DISABLED);
    if (await disabledDropdown.count() > 0) return true;
    // Check for disabled input
    const disabledInput = fieldContainer.locator(SELECTORS.INPUT_DISABLED);
    if (await disabledInput.count() > 0) return true;
    // Check for disabled attribute on select wrapper (.el-select__wrapper)
    const selectWrapper = fieldContainer.locator('.el-select__wrapper.is-disabled, .el-select[disabled]').first();
    if (await selectWrapper.count() > 0) return true;
    // Check aria-disabled on the select wrapper
    const ariaDisabled = fieldContainer.locator('.el-select__wrapper[aria-disabled="true"]').first();
    if (await ariaDisabled.count() > 0) return true;
    // Fallback: check if title attribute is set (Vue sets title when !isEditable)
    const selectEl = fieldContainer.locator('.el-select').first();
    if (await selectEl.count() > 0) {
      const title = await selectEl.getAttribute('title');
      if (title && title.length > 0) return true;
    }
    return false;
  }

  /**
   * Gets the visible text/value of a dropdown or input field by its label.
   * For dropdowns, reads the selected option text. For inputs, reads the input value.
   * @param {string} labelText - The label text of the field
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   * @returns {Promise<string>} The field value
   */
  async getFieldValueByLabel(labelText, { timeout = 5000 } = {}) {
    const fieldContainer = await this.fieldContainerByLabel(labelText);
    await fieldContainer.waitFor({ state: 'visible', timeout });
    // Try dropdown: get the visible text from the el-select's control area
    const selectWrapper = fieldContainer.locator('.el-select').first();
    if (await selectWrapper.count() > 0) {
      const text = await selectWrapper.innerText();
      if (text) return text.trim();
    }
    // Try text input (for input-textbox fields)
    const controlDiv = fieldContainer.locator('.control').first();
    if (await controlDiv.count() > 0) {
      const text = await controlDiv.innerText();
      if (text) return text.trim();
    }
    return '';
  }

  /**
   * Checks if any validation error message is visible on the page.
   * @returns {Promise<boolean>}
   */
  async isValidationErrorVisible() {
    const error = this.page.locator(SELECTORS.VALIDATION_ERROR).first();
    return error.isVisible();
  }

  /**
   * Waits for the financial-reference el-select to be visible.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async waitForFinancialReferenceDropdown({ timeout = 15000 } = {}) {
    try {
      await this.page.locator(SELECTORS.FINANCIAL_REFERENCE_SECTION).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.waitForFinancialReferenceDropdown] Financial Reference dropdown ` +
        `(selector: ${SELECTORS.FINANCIAL_REFERENCE_SECTION}) did not become visible within ${timeout}ms. ` +
        `Likely the financial-reference modal was not triggered after proceed-to-checkout — check that the ` +
        `user has financialReferenceCodes configured and that financialReferenceId is not already set. Original: ${err.message}`
      );
    }
  }

  /**
   * Opens the financial-reference dropdown by clicking its caret.
   */
  async openFinancialReferenceDropdown() {
    try {
      await this.page.locator(SELECTORS.FINANCIAL_REFERENCE_CARET).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.openFinancialReferenceDropdown] Could not click the Financial Reference ` +
        `dropdown caret (selector: ${SELECTORS.FINANCIAL_REFERENCE_CARET}). The caret was not visible or clickable ` +
        `within 10s — the financial-reference section may not have rendered yet. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the first non-disabled option in the currently open el-select dropdown.
   */
  async selectFirstFinancialReferenceOption() {
    const firstOption = this.page.locator(SELECTORS.FINANCIAL_REFERENCE_DROPDOWN_OPTION).first();
    try {
      await firstOption.waitFor({ state: 'visible', timeout: 10000 });
      await firstOption.click();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.selectFirstFinancialReferenceOption] Could not select the first available ` +
        `Financial Reference option (selector: ${SELECTORS.FINANCIAL_REFERENCE_DROPDOWN_OPTION}). The dropdown ` +
        `had no enabled options within 10s — the user may have no financial reference codes configured. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the modal-scoped "Proceed" confirmation button for the Financial Reference popup.
   * Uses an exact role+name match so it does not collide with the page-level
   * "Proceed to Checkout" CTA in the cart.
   *
   * @returns {import('playwright').Locator}
   */
  getFinancialReferenceProceedButton() {
    return this.page.getByRole('button', { name: 'Proceed', exact: true });
  }

  /**
   * Opens the financial-reference dropdown and returns the visible option texts.
   * Leaves the dropdown open so the caller can assert or interact with options.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string[]>}
   */
  async getFinancialReferenceDropdownOptionTexts({ timeout = 15000 } = {}) {
    await this.waitForFinancialReferenceDropdown({ timeout });
    await this.openFinancialReferenceDropdown();
    try {
      const optionLocator = this.page.locator(SELECTORS.FINANCIAL_REFERENCE_DROPDOWN_OPTION);
      await optionLocator.first().waitFor({ state: 'visible', timeout: 10000 });
      const count = await optionLocator.count();
      const texts = [];
      for (let i = 0; i < count; i++) {
        texts.push(((await optionLocator.nth(i).innerText()) || '').trim());
      }
      return texts;
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.getFinancialReferenceDropdownOptionTexts] Could not read options from ` +
        `financial reference dropdown (${SELECTORS.FINANCIAL_REFERENCE_DROPDOWN_OPTION}). Original: ${err.message}`
      );
    }
  }

  /**
   * Closes the financial-reference dropdown without selecting an option,
   * by pressing Escape.
   */
  async closeFinancialReferenceDropdown() {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Reads the Financial Reference section title shown in the reference-fields modal
   * (the .financial-section collapse header). This renders the localized
   * "Financial Reference" label ($t('cart.financialReferenceModal.modalTitle')).
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The trimmed title text
   */
  async getFinancialReferenceModalTitle({ timeout = 15000 } = {}) {
    const title = this.page.locator(SELECTORS.FINANCIAL_REFERENCE_MODAL_TITLE).first();
    try {
      await title.waitFor({ state: 'visible', timeout });
      return (await title.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.getFinancialReferenceModalTitle] The Financial Reference modal title ` +
        `(selector: ${SELECTORS.FINANCIAL_REFERENCE_MODAL_TITLE}) did not become visible within ${timeout}ms. ` +
        `Likely the financial-reference modal was not shown after proceed-to-checkout. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the Financial Reference modal's "Proceed" button to be visible and clicks it.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async clickFinancialReferenceProceedButton({ timeout = 15000 } = {}) {
    const btn = this.getFinancialReferenceProceedButton();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.clickFinancialReferenceProceedButton] Could not click the modal-scoped ` +
        `"Proceed" button (role=button name="Proceed" exact) within ${timeout}ms — likely an unrelated validation ` +
        `error in the Financial Reference modal blocked submission, or the modal already closed. Original: ${err.message}`
      );
    }
  }

}

/**
 * Builds a case-insensitive regex that matches a reference-field label EXACTLY, tolerating the
 * leading "*" mandatory marker and the trailing "info" icon text the label concatenates
 * (e.g. the field label "Location" renders as "Locationinfo" and "Location travel policy" renders
 * as "*Location travel policyinfo"). Anchoring the match is what lets an exact label like "Location"
 * be told apart from a longer label that merely contains it as a substring.
 *
 * @param {string} labelText
 * @returns {RegExp}
 */
function exactFieldLabelRegex(labelText) {
  const escaped = labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^\\s*\\*?\\s*' + escaped + '\\s*(?:info)?\\s*$', 'i');
}

module.exports = DynamicAndReferenceFieldsPage;
