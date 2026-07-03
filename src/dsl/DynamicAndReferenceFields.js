const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const DynamicAndReferenceFieldsPage = require("@pages/DynamicAndReferenceFieldsPage");
const { CommonPage } = require("@pages/CommonPage");
const { CheckoutPage } = require("@pages/CheckoutPage");
const { TravelRequestPage } = require("@pages/TravelRequestPage");

/**
 * DynamicAndReferenceFields DSL
 *
 * Exposes business-level actions for dynamic and reference fields.
 * - Explains intent
 * - Logs behavior
 * - Returns business-level results
 */
const DynamicAndReferenceFields = {
  /**
   * Selects "CONFERENCE" from the Trip Purpose reference field and proceeds.
   *
   * This flow:
   * - Opens the Trip Purpose dropdown
   * - Waits for and selects "CONFERENCE" option
   * - Waits for the Proceed button
   * - Clicks the Proceed button
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async selectTripPurposeReferenceField(page) {
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const commonPage = getPageObject(page, CommonPage);

    // Open the Trip Purpose dropdown
    await dynamicFieldsPage.clickToOpenDropdown("TRIP PURPOSE");

    // Wait for and select CONFERENCE option
    await dynamicFieldsPage.waitForDropdownOption("CONFERENCE");
    await dynamicFieldsPage.selectDropdownOption("CONFERENCE");

    // Wait for and click Proceed button
    await commonPage.getProceedButton().waitFor({ state: "visible" });
    await commonPage.clickProceedButton();
  },

  /**
   * Selects a given option from the Trip Purpose reference field and proceeds.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} option - The trip purpose option to select (e.g. "BILLABLE", "CONFERENCE")
   * @returns {Promise<void>}
   */
  async selectTripPurposeAndProceed(page, option) {
    if (!page) throw new Error('page is required');
    if (!option || typeof option !== 'string') throw new Error('option must be a non-empty string');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const commonPage = getPageObject(page, CommonPage);

    // Wait up to 60s for the Trip Purpose field — the reference-fields API can be
    // slow after a search, especially in CI, causing the default 30s to expire.
    await dynamicFieldsPage.getDropdownField("TRIP PURPOSE").waitFor({ state: "visible", timeout: 90000 });

    // Expand any collapsed traveler sections (e.g. guest travelers) so their
    // mandatory TRIP PURPOSE fields are also visible and fillable.
    await dynamicFieldsPage.expandAllCollapsedTravelerSections();

    // Fill TRIP PURPOSE for every visible traveler (first expanded, then newly expanded)
    const allFields = dynamicFieldsPage.getAllDropdownFields("TRIP PURPOSE");
    const fieldCount = await allFields.count();
    for (let i = 0; i < fieldCount; i++) {
      const field = allFields.nth(i);
      if (await field.isVisible()) {
        await field.click();
        await dynamicFieldsPage.waitForDropdownOption(option);
        await dynamicFieldsPage.selectDropdownOption(option);
      }
    }

    await commonPage.getProceedButton().waitFor({ state: "visible" });
    await commonPage.clickProceedButton();
  },

  /**
   * Fills in a checkout number field with the value "11111".
   * Used for checkout workflows that require a reference or tracking number.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} [fieldIndex=5] - The index of the text field to fill (default is 5).
   * @returns {Promise<void>}
   */
  async addNumberCheckoutField(page, fieldIndex = 5) {
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Fill the text field with the checkout number
    await dynamicFieldsPage.fillInTextField("11111", fieldIndex);
  },

  /**
   * Waits for the Save button in a modal to be visible and clicks it.
   * Useful for dynamic/reference field modals that require explicit save.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async waitAndClickSaveButtonModal(page) {
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const travelRequestPage = getPageObject(page, TravelRequestPage);
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure
    await dynamicFieldsPage.waitForSaveButtonModal();
    await dynamicFieldsPage.clickSaveButtonModal();
    await travelRequestPage.waitForSentToAgentMessage();
    await checkoutPage.clickGoToTripButton();
  },

  /**
   * Waits for checkout page to be fully loaded (booking details heading visible).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async waitForCheckoutBookingDetails(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();
  },

  /**
   * Fills in a checkout reference field identified by its label text with a given value.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} fieldName - The visible label of the reference field (e.g. "ORDER NUMBER")
   * @param {string} value - The value to fill in (e.g. "1111")
   * @returns {Promise<void>}
   */
  async fillCheckoutReferenceField(page, fieldName, value) {
    if (!page) throw new Error('page is required');
    if (!fieldName || typeof fieldName !== 'string') throw new Error('fieldName must be a non-empty string, got: ' + typeof fieldName);
    if (value === undefined || value === null) throw new Error('value is required');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    // Small wait for checkout fields to fully render
    await page.waitForTimeout(2000);

    await dynamicFieldsPage.fillReferenceFieldByLabel(fieldName, String(value));
  },

  /**
   * Waits for a reference field dropdown to appear, selects an option, and proceeds.
   * If no reference field appears within the timeout, silently proceeds without error.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} fieldName - The name attribute of the dropdown (e.g. "Type of Trip")
   * @param {string} optionText - Text to match in the dropdown option (partial match supported)
   * @param {object} [options]
   * @param {number} [options.timeout=10000] - How long to wait for the field to appear
   * @returns {Promise<{fieldFound: boolean}>}
   */
  async selectReferenceFieldDropdownIfVisible(page, fieldName, optionText, { timeout = 10000 } = {}) {
    if (!page) throw new Error('page is required');
    if (!fieldName || typeof fieldName !== 'string') throw new Error('fieldName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');

    const commonPage = getPageObject(page, CommonPage);

    // Case-insensitive regex matchers — UI label may be e.g. "Soort Reis/Type Of Trip"
    // while the step passes "Type of Trip"; option may be "Education and courses" vs "EDUCATION".
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const labelRegex = new RegExp(escape(fieldName), 'i');
    const optionRegex = new RegExp(escape(optionText), 'i');

    // Soft-check: did the field actually appear within the timeout? If not, exit silently
    // (some flows expect the popup to NOT appear, e.g. travelers without NL reference config).
    const label = page.locator('label').filter({ hasText: labelRegex }).first();
    try {
      await label.waitFor({ state: 'visible', timeout });
    } catch {
      return { fieldFound: false };
    }

    // Field IS visible — from here on, errors are real failures and must surface.
    try {
      await label.scrollIntoViewIfNeeded({ timeout: 5000 });

      // Find the el-select dropdown within the same field container
      const selectWrapper = label.locator('..').locator('.el-select').first();
      await selectWrapper.click({ timeout: 5000 });

      // Select the option by case-insensitive partial text match in the dropdown popup
      const option = page.locator('.el-select-dropdown__item').filter({ hasText: optionRegex }).first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectReferenceFieldDropdownIfVisible] Reference field "${fieldName}" was visible ` +
        `but selecting option "${optionText}" failed — likely the dropdown structure changed or the option text no longer matches. ` +
        `Original: ${err.message}`
      );
    }

    // Confirm with whichever button is present (Proceed in most flows, Save in the NL Trip Reference Form modal).
    // Sequential, deterministic: prefer Proceed; only fall back to Save if Proceed never appears.
    const proceedBtn = commonPage.getProceedButton();
    const saveBtn = commonPage.getSaveButton();
    let confirmBtn = null;
    try {
      await proceedBtn.waitFor({ state: 'visible', timeout: 10000 });
      confirmBtn = proceedBtn;
    } catch {
      try {
        await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
        confirmBtn = saveBtn;
      } catch (err) {
        throw new Error(
          `[DynamicAndReferenceFields.selectReferenceFieldDropdownIfVisible] Selected "${optionText}" for "${fieldName}" ` +
          `but neither a "Proceed" nor a "Save" button became visible to dismiss the modal. ` +
          `Original: ${err.message || err}`
        );
      }
    }
    try {
      await confirmBtn.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectReferenceFieldDropdownIfVisible] Failed to click the confirmation button ` +
        `after selecting "${optionText}" for "${fieldName}". Original: ${err.message}`
      );
    }

    return { fieldFound: true };
  },

  /**
   * Verifies that the Financial Reference modal shows the expected title text
   * (the .financial-section collapse header in the reference-fields modal).
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - The expected modal title (e.g. "Financial Reference")
   * @returns {Promise<void>}
   */
  async verifyFinancialReferenceModalTitle(page, expectedTitle) {
    if (!page) {
      throw new Error('[DynamicAndReferenceFields.verifyFinancialReferenceModalTitle] "page" is required.');
    }
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyFinancialReferenceModalTitle] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle}`
      );
    }

    try {
      const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
      const actualTitle = await dynamicFieldsPage.getFinancialReferenceModalTitle();
      expect(
        actualTitle,
        `Financial Reference modal title mismatch. Expected "${expectedTitle}", got "${actualTitle}". ` +
        `The financial-reference modal may not have opened after proceed-to-checkout.`
      ).toBe(expectedTitle);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[DynamicAndReferenceFields.verifyFinancialReferenceModalTitle] Failed to verify the Financial Reference ` +
        `modal title "${expectedTitle}": ${err.message}`
      );
    }
  },

  /**
   * Opens the financial-reference dropdown, verifies that each expected option
   * is present (case-insensitive partial match), then closes the dropdown.
   *
   * @param {import('playwright').Page} page
   * @param {string[]} expectedOptions - Option texts that must appear in the dropdown
   * @returns {Promise<void>}
   */
  async verifyFinancialReferenceOptions(page, expectedOptions) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyFinancialReferenceOptions] "page" is required.');
    if (!Array.isArray(expectedOptions) || expectedOptions.length === 0) {
      throw new Error('[DynamicAndReferenceFields.verifyFinancialReferenceOptions] "expectedOptions" must be a non-empty array.');
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    let actualOptions;
    try {
      actualOptions = await dynamicFieldsPage.getFinancialReferenceDropdownOptionTexts();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyFinancialReferenceOptions] Failed to read financial reference options: ${err.message}`
      );
    }

    const missing = expectedOptions.filter(
      (expected) => !actualOptions.some((actual) => actual.toLowerCase().includes(expected.toLowerCase()))
    );

    await dynamicFieldsPage.closeFinancialReferenceDropdown();

    if (missing.length > 0) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyFinancialReferenceOptions] Missing financial reference options: [${missing.join(', ')}]. ` +
        `Actual options found: [${actualOptions.join(', ')}]`
      );
    }
  },

  /**
   * Selects an option from a reference field dropdown WITHOUT clicking Proceed.
   * Use when filling multiple fields before proceeding (i.e. follow with
   * "I click proceed on the reference fields popup").
   *
   * @param {import('playwright').Page} page
   * @param {string} fieldName - Visible label of the dropdown field (e.g. "Type of Trip")
   * @param {string} optionText - Text to match in the dropdown option (partial, case-insensitive)
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<void>}
   */
  async selectReferenceFieldDropdownOnly(page, fieldName, optionText, { timeout = 10000 } = {}) {
    if (!page) throw new Error('page is required');
    if (!fieldName || typeof fieldName !== 'string') throw new Error('fieldName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');

    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Anchor the label match so "Location" does NOT also match "Location travel policy".
    // The question text is rendered in its own <span> inside the label
    // (input-dropdown.vue), so an exact (anchored) match on that span uniquely
    // identifies the field. A plain substring match would pick whichever matching
    // container appears first in the DOM (e.g. "Location travel policy"), causing
    // the option to be typed into the wrong field.
    const labelRegex = new RegExp('^\\s*' + escape(fieldName) + '\\s*$', 'i');
    const optionRegex = new RegExp(escape(optionText), 'i');

    // Scope to the .input-dropdown container whose label span exactly matches fieldName.
    const fieldContainer = page
      .locator('.input-dropdown')
      .filter({ has: page.locator('label span', { hasText: labelRegex }) })
      .first();
    try {
      await fieldContainer.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectReferenceFieldDropdownOnly] Field "${fieldName}" did not appear within ${timeout}ms. ` +
        `Reference fields popup may not have opened. Original: ${err.message}`
      );
    }

    try {
      await fieldContainer.scrollIntoViewIfNeeded({ timeout: 5000 });
      const selectWrapper = fieldContainer.locator('.el-select').first();
      await selectWrapper.click({ timeout: 5000 });

      // The el-select is filterable (input-dropdown.vue sets filterable on el-select).
      // Typing the option text after opening filters the list to matching items only,
      // which makes them visible regardless of dropdown overflow or scrollbar clipping.
      await page.keyboard.type(optionText, { delay: 30 });

      // Wait for the filtered list to have at least one matching item.
      const option = page.locator('.el-select-dropdown__item').filter({ hasText: optionRegex }).first();
      await option.waitFor({ state: 'attached', timeout: 5000 });

      // In filterable el-select, Enter alone doesn't select if no option is highlighted.
      // ArrowDown navigates to the first filtered result, then Enter commits selection
      // and closes the dropdown popper.
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Give the popper time to finish its close animation before the next field click.
      await page.waitForTimeout(300);
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectReferenceFieldDropdownOnly] Field "${fieldName}" was visible ` +
        `but selecting option "${optionText}" failed. Original: ${err.message}`
      );
    }
  },

  /**
   * Selects the FIRST available option from a reference field dropdown WITHOUT clicking Proceed.
   * Use for a mandatory reference field whose configured options vary per corporate profile — the
   * test just needs to fill it with a valid value to proceed, so it takes the first option rather
   * than a hard-coded label that may not exist for a given booker. Follow with
   * "I click proceed on the reference fields popup".
   *
   * @param {import('playwright').Page} page
   * @param {string} fieldName - Visible label of the dropdown field (e.g. "Soort reis/Type of trip")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<{selectedOption: string}>}
   */
  async selectFirstReferenceFieldOption(page, fieldName, { timeout = 10000 } = {}) {
    if (!page) throw new Error('page is required');
    if (!fieldName || typeof fieldName !== 'string') throw new Error('fieldName must be a non-empty string, got: ' + typeof fieldName);

    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Anchor the label match so "Location" does NOT also match "Location travel policy" (same
    // reasoning as selectReferenceFieldDropdownOnly). The question text is in its own <span>.
    const labelRegex = new RegExp('^\\s*' + escape(fieldName) + '\\s*$', 'i');

    const fieldContainer = page
      .locator('.input-dropdown')
      .filter({ has: page.locator('label span', { hasText: labelRegex }) })
      .first();
    try {
      await fieldContainer.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstReferenceFieldOption] Field "${fieldName}" did not appear within ${timeout}ms. ` +
        `Reference fields popup may not have opened. Original: ${err.message}`
      );
    }

    try {
      await fieldContainer.scrollIntoViewIfNeeded({ timeout: 5000 });
      const selectWrapper = fieldContainer.locator('.el-select').first();
      await selectWrapper.click({ timeout: 5000 });

      // From the freshly opened, unfiltered list, ArrowDown highlights the first option and Enter
      // commits it — acting on the active dropdown without needing to locate an option element
      // (which could collide with another field's dropdown popper). Mirrors the commit keys used by
      // selectReferenceFieldDropdownOnly.
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Give the popper time to finish its close animation before the next interaction.
      await page.waitForTimeout(300);

      const selectedOption = ((await selectWrapper.innerText()) || '').trim();
      return { selectedOption };
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstReferenceFieldOption] Field "${fieldName}" was visible ` +
        `but selecting its first option failed — the dropdown may have had no selectable options. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies that all specified field labels are visible in the reference fields popup.
   * @param {import('playwright').Page} page
   * @param {string[]} labels - Array of label texts to check
   * @returns {Promise<{allVisible: boolean, results: Array<{label: string, visible: boolean}>}>}
   */
  async verifyReferenceFieldLabelsVisible(page, labels) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(labels)) throw new Error('labels must be an array, got: ' + typeof labels);

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const results = [];
    for (const label of labels) {
      const visible = await dynamicFieldsPage.isFieldLabelVisible(label);
      results.push({ label, visible });
    }
    const allVisible = results.every(r => r.visible);
    return { allVisible, results };
  },

  /**
   * Verifies that specific checkout reference field labels are visible.
   * @param {import('playwright').Page} page
   * @param {string[]} labels
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<{allVisible: boolean, results: Array<{label: string, visible: boolean}>}>}
   */
  async verifyCheckoutReferenceFieldLabelsVisible(page, labels, { timeout = 15000 } = {}) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(labels)) throw new Error('labels must be an array, got: ' + typeof labels);

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await checkoutPage.waitForBookingDetailsText();

    const results = [];
    for (const label of labels) {
      const visible = await dynamicFieldsPage.isFieldLabelVisible(label, { timeout });
      results.push({ label, visible });
    }

    const allVisible = results.every(result => result.visible);
    return { allVisible, results };
  },

  /**
   * Verifies that specific checkout reference field labels are not visible.
   * @param {import('playwright').Page} page
   * @param {string[]} labels
   * @param {object} [options]
   * @param {number} [options.timeout=2000]
   * @returns {Promise<{allHidden: boolean, results: Array<{label: string, visible: boolean}>}>}
   */
  async verifyCheckoutReferenceFieldLabelsNotVisible(page, labels, { timeout = 2000 } = {}) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(labels)) throw new Error('labels must be an array, got: ' + typeof labels);

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await checkoutPage.waitForBookingDetailsText();

    const results = [];
    for (const label of labels) {
      const visible = await dynamicFieldsPage.isFieldLabelVisible(label, { timeout });
      results.push({ label, visible });
    }

    const allHidden = results.every(result => !result.visible);
    return { allHidden, results };
  },

  /**
   * Verifies that specific field labels have expected values.
   * @param {import('playwright').Page} page
   * @param {Array<{label: string, expectedValue: string}>} fieldValuePairs
   * @returns {Promise<{allMatch: boolean, results: Array<{label: string, expected: string, actual: string, match: boolean}>}>}
   */
  async verifyReferenceFieldValues(page, fieldValuePairs) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(fieldValuePairs)) throw new Error('fieldValuePairs must be an array');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const results = [];
    for (const { label, expectedValue } of fieldValuePairs) {
      const actual = await dynamicFieldsPage.getFieldValueByLabel(label);
      const match = actual.toLowerCase().includes(expectedValue.toLowerCase());
      results.push({ label, expected: expectedValue, actual, match });
    }
    const allMatch = results.every(r => r.match);
    return { allMatch, results };
  },

  /**
   * Verifies that specified reference fields are not editable (disabled).
   * @param {import('playwright').Page} page
   * @param {string[]} fieldLabels - Array of field label texts to check
   * @returns {Promise<{allDisabled: boolean, results: Array<{label: string, disabled: boolean}>}>}
   */
  async verifyReferenceFieldsNotEditable(page, fieldLabels) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(fieldLabels)) throw new Error('fieldLabels must be an array');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const results = [];
    for (const label of fieldLabels) {
      const disabled = await dynamicFieldsPage.isFieldDisabled(label);
      results.push({ label, disabled });
    }
    const allDisabled = results.every(r => r.disabled);
    return { allDisabled, results };
  },

  /**
   * Clicks the Proceed button and verifies that a validation error appears.
   * Used to verify that mandatory fields are enforced.
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>} True if validation error is visible after clicking proceed
   */
  async clickProceedAndVerifyMandatoryError(page) {
    if (!page) throw new Error('page is required');

    const commonPage = getPageObject(page, CommonPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await commonPage.getProceedButton().waitFor({ state: 'visible', timeout: 10000 });
    await commonPage.clickProceedButton();

    // Wait briefly for validation to trigger
    await page.waitForTimeout(1000);
    return dynamicFieldsPage.isValidationErrorVisible();
  },

  /**
   * Waits for the reference fields popup Proceed button to be visible and clicks it.
   * Use when the popup appears and all required fields are already pre-filled,
   * so no field selection is needed — just dismiss the popup to continue.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async proceedThroughReferenceFieldsPopup(page) {
    if (!page) throw new Error('page is required');

    const commonPage = getPageObject(page, CommonPage);
    await commonPage.getProceedButton().waitFor({ state: 'visible', timeout: 15000 });
    await commonPage.clickProceedButton();
  },

  /**
   * Selects the first available Financial Reference code from the modal
   * (cart.financialReferenceModal) that appears after clicking "Proceed to checkout"
   * when the user has financialReferenceCodes configured.
   *
   * Flow: wait for financial-reference section -> open el-select -> click first
   * non-disabled option -> click the Proceed button to confirm.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async selectFirstFinancialReference(page) {
    if (!page) {
      throw new Error('[DynamicAndReferenceFields.selectFirstFinancialReference] "page" is required.');
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    try {
      await dynamicFieldsPage.waitForFinancialReferenceDropdown();
      await dynamicFieldsPage.openFinancialReferenceDropdown();
      await dynamicFieldsPage.selectFirstFinancialReferenceOption();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstFinancialReference] Failed to pick the first Financial Reference ` +
        `option from the post-cart modal: ${err.message}`
      );
    }

    try {
      // Use exact-text match: "Proceed" alone (not "Proceed to Checkout" which also lives on the page).
      const modalProceed = page.getByRole('button', { name: 'Proceed', exact: true });
      await modalProceed.waitFor({ state: 'visible', timeout: 15000 });
      await modalProceed.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstFinancialReference] Selected the first Financial Reference but ` +
        `could not click the Proceed button to confirm and continue to checkout. The button was not visible ` +
        `within 15s \u2014 likely an unrelated validation error in the same modal blocked submission. Original: ${err.message}`
      );
    }
  },

};

// Export DynamicAndReferenceFields DSL for use in tests
module.exports = DynamicAndReferenceFields;
