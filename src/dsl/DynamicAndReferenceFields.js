const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const DynamicAndReferenceFieldsPage = require("@pages/DynamicAndReferenceFieldsPage");
const { CommonPage } = require("@pages/CommonPage");
const { CheckoutPage } = require("@pages/CheckoutPage");
const { TravelRequestPage } = require("@pages/TravelRequestPage");
const { sortAlphabetically } = require("@utils/text");
const logger = require("@utils/logger").child("DynamicAndReferenceFields-DSL");

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
   * Verifies that a dynamic profile field is displayed for exactly the expected number of travellers
   * at checkout. Each guest/traveller renders their own `traveler-questions` block, so the assertion
   * counts how many blocks show the field and compares to the expected count. Polls while the
   * per-traveller sections finish rendering after the "Booking details" heading appears, so a second
   * traveller's section that renders a beat later is not missed.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} fieldName - The dynamic profile field label (e.g. "DYNA PROF TST")
   * @param {number} expectedCount - How many travellers should show the field (>= 1)
   * @returns {Promise<void>}
   */
  async verifyDynamicProfileFieldDisplayedForTravelers(page, fieldName, expectedCount) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyDynamicProfileFieldDisplayedForTravelers] "page" is required.');
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyDynamicProfileFieldDisplayedForTravelers] "fieldName" must be a ` +
        `non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }
    if (!Number.isInteger(expectedCount) || expectedCount < 1) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyDynamicProfileFieldDisplayedForTravelers] "expectedCount" must be an ` +
        `integer >= 1, got: ${typeof expectedCount} (${expectedCount})`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure the checkout "Booking details" region is present before polling for traveller sections.
    await checkoutPage.waitForBookingDetailsText();

    logger.debug('Verifying dynamic profile field displayed for travellers at checkout', { fieldName, expectedCount });

    await expect
      .poll(async () => dynamicFieldsPage.countTravelerSectionsShowingDynamicField(fieldName), {
        timeout: 20000,
        message:
          `Expected the dynamic profile field "${fieldName}" to be displayed for ${expectedCount} traveller(s) ` +
          `at checkout, but the number of per-traveller question blocks showing it did not reach ${expectedCount}. ` +
          `The field may not be inherited for every guest, or the traveller sections did not render.`,
      })
      .toBe(expectedCount);
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

      // Select the option by case-insensitive partial text match, scoped to the VISIBLE dropdown
      // popper — the DOM holds hidden el-select poppers from other closed dropdowns, so an unscoped
      // match resolves to a hidden <li> and never becomes clickable.
      const option = page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({ hasText: optionRegex }).first();
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
   * Verifies the Financial Reference section shows its mandatory "*" marker in the reference-fields
   * popup (i.e. the section is required). Reads the marker via the page object.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyFinancialReferenceMandatoryMarker(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyFinancialReferenceMandatoryMarker] "page" is required.');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const visible = await dynamicFieldsPage.isFinancialReferenceMandatoryMarkerVisible();
    expect(
      visible,
      `[DynamicAndReferenceFields.verifyFinancialReferenceMandatoryMarker] Expected the Financial Reference ` +
      `section to show a mandatory "*" marker in the reference-fields popup, but it was not visible. The ` +
      `financial-reference section may not have rendered, or it is not configured as mandatory for this user.`
    ).toBe(true);
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
   * Verifies that a per-traveler reference section for the given traveler is shown in the
   * travel-request (reference-fields) popup, by asserting the traveler's name is visible
   * inside the traveller section. Used to confirm each added traveler gets their own
   * reference section driven by the primary traveler's configuration.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} travelerName - Full traveler name as shown in the section header (e.g. "Pini Cohen")
   * @returns {Promise<void>}
   */
  async verifyTravelerSectionHeader(page, travelerName) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyTravelerSectionHeader] "page" is required.');
    if (!travelerName || typeof travelerName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravelerSectionHeader] "travelerName" must be a non-empty string, got: ${typeof travelerName}`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const visible = await dynamicFieldsPage.isTravelerNameVisible(travelerName);

    expect(
      visible,
      `[DynamicAndReferenceFields.verifyTravelerSectionHeader] Expected a reference section for traveler ` +
      `"${travelerName}" in the travel-request popup, but the traveler name was not visible inside the ` +
      `traveller section. The primary traveler's reference configuration may not have rendered this ` +
      `traveler's section, or the name display form differs from what was entered.`
    ).toBe(true);
  },

  /**
   * Ensures the Financial Reference dropdown in the travel-request popup is rendered and ready.
   *
   * NOTE: this intentionally does NOT click the dropdown open. The immediately-following assertion
   * step ("the financial reference dropdown should contain the following options") calls
   * verifyFinancialReferenceOptions, which opens, reads, and Escape-closes the dropdown itself.
   * Clicking the caret here would toggle the el-select closed and break that read.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async openFinancialReferenceDropdown(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.openFinancialReferenceDropdown] "page" is required.');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    try {
      await dynamicFieldsPage.waitForFinancialReferenceDropdown();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.openFinancialReferenceDropdown] The Financial Reference dropdown was not ` +
        `ready in the travel-request popup. Likely the reference-fields popup has not rendered the ` +
        `financial-reference section yet. Original: ${err.message}`
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

    // The Financial Reference field renders as a collapse-section el-select (financial-reference.vue),
    // NOT a `.input-dropdown` with a label span, so it can't be located the generic way. Route it to
    // the dedicated financial-reference selector. Anchor the match so the distinct "Financial Reference
    // Code" NL-gov field is NOT swept into this branch.
    if (/^\s*financial\s*reference\s*$/i.test(fieldName)) {
      const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
      await dynamicFieldsPage.selectFinancialReferenceOptionByText(optionText, { timeout: Math.max(timeout, 15000) });
      return;
    }

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
   * Types text into a reference field found by its label and selects the FIRST resulting option,
   * handling BOTH reference-field widgets: an el-select "dropdown" (type-to-filter → first filtered
   * item) and an "autocomplete" text field (type → first fetched suggestion). Routes by detecting the
   * field's rendered widget, so one "type ... select first dropdown option" step works for a simple
   * dropdown (e.g. "BILLABLE OR NON BILLABLE") and a dependent autocomplete field that only appears
   * after the parent is set (e.g. "MATTER CODE CLIENT TRAVEL") — the autocomplete + dependency flow of
   * test 37964.
   *
   * @param {import('playwright').Page} page
   * @param {string} fieldName - Visible label of the reference field
   * @param {string} text - Text to type to filter/fetch options (e.g. "YES", "33")
   * @returns {Promise<void>}
   */
  async typeAndSelectFirstReferenceFieldOption(page, fieldName, text) {
    if (!page) throw new Error('[DynamicAndReferenceFields.typeAndSelectFirstReferenceFieldOption] "page" is required.');
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.typeAndSelectFirstReferenceFieldOption] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }
    if (!text || typeof text !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.typeAndSelectFirstReferenceFieldOption] "text" must be a non-empty string, got: ${typeof text} (${text})`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Typing in reference field to select the first option', { fieldName, text });

    const widget = await dynamicFieldsPage.resolveReferenceFieldWidget(fieldName);
    if (widget === 'autocomplete') {
      await dynamicFieldsPage.typeAndSelectFirstAutocompleteOption(fieldName, text);
      return;
    }
    // el-select dropdown (or a collapse-section select): reuse the filter-then-commit-first flow.
    await this.selectReferenceFieldDropdownOnly(page, fieldName, text);
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
   * Selects the FIRST available option for a reference field belonging to ONE named traveller,
   * without submitting the popup.
   *
   * Exists separately from selectFirstReferenceFieldOption because the Travellers Reference Questions
   * section renders the same label once per passenger (e.g. "Payment Group" for each traveller). The
   * unscoped method filters `.input-dropdown` by label and takes `.first()`, so on a multi-traveller
   * trip it always fills the FIRST traveller's copy — silently the wrong field when the mandatory,
   * empty one belongs to a later traveller (test 29722: the guest primary "Israel Israeli").
   *
   * @param {import('playwright').Page} page
   * @param {string} fieldName - Visible dropdown label (e.g. "Payment Group")
   * @param {string} travellerName - Traveller full name as shown in the passenger header (e.g. "Israel Israeli")
   * @returns {Promise<{selectedOption: string}>}
   */
  async selectFirstReferenceFieldOptionForTraveller(page, fieldName, travellerName) {
    if (!page) throw new Error('[DynamicAndReferenceFields.selectFirstReferenceFieldOptionForTraveller] "page" is required.');
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstReferenceFieldOptionForTraveller] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }
    if (!travellerName || typeof travellerName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstReferenceFieldOptionForTraveller] "travellerName" must be a non-empty string, got: ${typeof travellerName} (${travellerName})`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Selecting the first available option for a traveller-scoped reference field', { fieldName, travellerName });
    try {
      return await dynamicFieldsPage.selectFirstTravellerReferenceFieldOption(travellerName, fieldName);
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstReferenceFieldOptionForTraveller] Could not fill the mandatory "${fieldName}" ` +
        `reference field for traveller "${travellerName}", so the travel request cannot be submitted. Original: ${err.message}`
      );
    }
  },

  /**
   * Selects the first available option for EVERY traveller's copy of a mandatory reference-field
   * dropdown, or (whichever widget the field actually renders as) fills every still-empty copy of a
   * free-text field with the given value (ADO #80167 — a UK Rail multi-traveller booking needs its
   * "Travel Type" question — a plain text field, not a dropdown — answered for all travellers,
   * including a randomly-generated guest whose name isn't known ahead of time in the test, so neither
   * the unscoped `.first()` variant nor the named-traveller variant above can be used here).
   *
   * @param {import('playwright').Page} page
   * @param {string} fieldName - Field label repeated once per traveller (e.g. "Travel Type")
   * @param {string} [textValue="abc"] - Value typed into a free-text copy of the field; ignored for a dropdown copy
   * @returns {Promise<{filledCount: number}>}
   */
  async selectFirstAvailableOptionForAllTravelers(page, fieldName, textValue = 'abc') {
    if (!page) throw new Error('[DynamicAndReferenceFields.selectFirstAvailableOptionForAllTravelers] "page" is required.');
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstAvailableOptionForAllTravelers] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Selecting/filling the first available value for all travellers\' copy of a reference field', { fieldName, textValue });
    try {
      return await dynamicFieldsPage.selectFirstAvailableOptionForAllTravelers(fieldName, textValue);
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.selectFirstAvailableOptionForAllTravelers] Could not fill the mandatory "${fieldName}" ` +
        `reference field for every traveller, so the travel request cannot be submitted. Original: ${err.message}`
      );
    }
  },

  /**
   * Dismisses the open reference-fields popup via its Back/Close button, returning to the new-trip
   * page without proceeding. Used when the traveller set must be changed (e.g. adding a guest) before
   * re-running the search. Follow with an "add traveller" step and a fresh search.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async closeReferenceFieldsPopup(page) {
    if (!page) throw new Error('page is required');
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    await dynamicFieldsPage.closeReferenceFieldsPopup();
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
   * Verifies how many reference fields the checkout page displays in total.
   *
   * Counts every field across all four question sections the questionnaire renders (general,
   * per-traveller, per-quote and per-quote-per-traveller), because which section a field lands in is
   * an admin configuration choice: a "show at checkout only when non-gds hotel" field is a PRODUCT
   * question and never appears in the general section. Counting one section would silently report 0
   * for a field the page is plainly showing.
   *
   * Polls the count rather than reading it once: the reference-fields form renders asynchronously
   * after the "Booking details" heading, so a single read can catch it half-built — and polling is
   * also what lets an expected count of 0 be verified.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount
   * @returns {Promise<{count: number, labels: string[]}>}
   */
  async verifyCheckoutReferenceFieldCount(page, expectedCount) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyCheckoutReferenceFieldCount] "page" is required.');
    if (typeof expectedCount !== 'number' || !Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyCheckoutReferenceFieldCount] "expectedCount" must be a non-negative ` +
        `integer, got: ${typeof expectedCount} (${expectedCount})`
      );
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await checkoutPage.waitForBookingDetailsText();

    try {
      await expect
        .poll(async () => (await dynamicFieldsPage.getDisplayedReferenceFieldLabels()).length, { timeout: 20000 })
        .toBe(expectedCount);
    } catch (err) {
      const labels = await dynamicFieldsPage.getDisplayedReferenceFieldLabels();
      throw new Error(
        `[DynamicAndReferenceFields.verifyCheckoutReferenceFieldCount] Expected exactly ${expectedCount} checkout ` +
        `reference field(s), got ${labels.length}: ${labels.map((label) => `"${label}"`).join(', ') || 'none'}. ` +
        `Counted across the general, per-traveller, per-quote and per-quote-per-traveller sections. ` +
        `Original: ${err.message}`
      );
    }

    const labels = await dynamicFieldsPage.getDisplayedReferenceFieldLabels();
    logger.info('Checkout reference field count matches expected', { expectedCount, labels });
    return { count: labels.length, labels };
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
      // An EMPTY expected value asserts the field is blank, and must be compared strictly: the
      // substring match below is vacuously true for '' (`includes('')`), so it would silently pass
      // whatever the field actually holds. Blank is only meaningful for a FREE-TEXT field — an empty
      // el-input renders no text at all (input-textbox.vue has no placeholder), whereas an empty
      // dropdown renders the "Select" placeholder and should be asserted with that value instead.
      const match = expectedValue === '' ? actual === '' : actual.toLowerCase().includes(expectedValue.toLowerCase());
      results.push({ label, expected: expectedValue, actual, match });
    }
    const allMatch = results.every(r => r.match);
    return { allMatch, results };
  },

  /**
   * Verifies that ONE named traveller's reference fields hold the expected values.
   *
   * The traveller-scoped counterpart of verifyReferenceFieldValues: that method resolves each label
   * page-wide with `.first()`, so on a multi-traveller trip every row reports the FIRST traveller's
   * value. Any per-traveller label ("Payment Group", "Bank account") therefore needs this variant —
   * asserting two different expected values for the same label without it can never pass.
   *
   * @param {import('playwright').Page} page
   * @param {string} travellerName - Traveller full name as shown in the passenger header (e.g. "Israel Israeli")
   * @param {Array<{label: string, expectedValue: string}>} fieldValuePairs
   * @returns {Promise<{allMatch: boolean, results: Array<{label: string, expected: string, actual: string, match: boolean}>}>}
   */
  async verifyTravellerReferenceFieldValues(page, travellerName, fieldValuePairs) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyTravellerReferenceFieldValues] "page" is required.');
    if (!travellerName || typeof travellerName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldValues] "travellerName" must be a non-empty string, got: ${typeof travellerName} (${travellerName})`
      );
    }
    if (!Array.isArray(fieldValuePairs) || fieldValuePairs.length === 0) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldValues] "fieldValuePairs" must be a non-empty array, got: ${typeof fieldValuePairs}`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Reading traveller-scoped reference field values', { travellerName, fieldValuePairs });

    const results = [];
    for (const { label, expectedValue } of fieldValuePairs) {
      let actual;
      try {
        actual = await dynamicFieldsPage.getTravellerFieldValue(travellerName, label);
      } catch (err) {
        throw new Error(
          `[DynamicAndReferenceFields.verifyTravellerReferenceFieldValues] Could not read the "${label}" reference field ` +
          `of traveller "${travellerName}", so its expected value "${expectedValue}" could not be verified. Original: ${err.message}`
        );
      }
      // An empty expected value asserts the field is blank; otherwise match case-insensitively on
      // substring, as verifyReferenceFieldValues does (the control text can carry extra markup text).
      const match = expectedValue === '' ? actual === '' : actual.toLowerCase().includes(expectedValue.toLowerCase());
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
   * Opens the named checkout reference-field dropdown and verifies it offers the expected option
   * display values, then closes it. Used to assert a dynamic field "displays value from Option, not
   * the GDS output code": the option labels shown are the Option display values — e.g. test 54444,
   * where opening the "Can Edit" dropdown reveals Alabama / Colorado / Louisiana. These are dropdown
   * options, not field labels or selected values, so the label/value verifiers cannot find them.
   * @param {import('playwright').Page} page
   * @param {string} fieldName - Visible dropdown label / question text (e.g. "Can Edit")
   * @param {string[]} expectedOptions
   * @returns {Promise<{results: Array<{option: string, present: boolean}>}>}
   */
  async verifyCheckoutReferenceFieldDropdownOptions(page, fieldName, expectedOptions) {
    if (!page) throw new Error('page is required');
    if (!fieldName || typeof fieldName !== 'string') throw new Error('fieldName must be a non-empty string, got: ' + typeof fieldName);
    if (!Array.isArray(expectedOptions)) throw new Error('expectedOptions must be an array, got: ' + typeof expectedOptions);

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await checkoutPage.waitForBookingDetailsText();
    await dynamicFieldsPage.openReferenceFieldDropdownByLabel(fieldName);

    // Read the whole option list in one pass, then close the panel so a lingering popper doesn't
    // overlay later steps (cancellation, navigation). Comparing in memory avoids a per-option wait
    // (a missing option would otherwise cost a full visibility timeout each).
    const actualOptions = await dynamicFieldsPage.getOpenDropdownOptionTexts();
    await dynamicFieldsPage.closeOpenDropdown();

    const results = expectedOptions.map((option) => ({
      option,
      present: actualOptions.some((actual) => actual.toLowerCase().includes(option.toLowerCase())),
    }));
    return { results };
  },

  /**
   * Clicks the Proceed button and verifies that a validation error appears.
   * Used to verify that mandatory fields are enforced.
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>} True if validation error is visible after clicking proceed
   */
  async clickProceedAndVerifyMandatoryError(page) {
    if (!page) throw new Error('page is required');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    // Submit via Proceed (cart flow) or Save (request-assistance Trip Reference Form) — whichever exists.
    await dynamicFieldsPage.submitReferenceFieldsPopup();

    // Wait briefly for validation to trigger
    await page.waitForTimeout(1000);
    return dynamicFieldsPage.isValidationErrorVisible();
  },

  /**
   * Verifies that a custom validation error is displayed below a specific reference/dynamic field.
   * Param order matches the Gherkin: expected error text first, field label second.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedError - The expected custom error text (e.g. "max length is 8")
   * @param {string} fieldName - The label of the reference field (e.g. "Bank account")
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldCustomError(page, expectedError, fieldName) {
    if (!page) throw new Error('page is required');
    if (!expectedError || typeof expectedError !== 'string') {
      throw new Error(`expectedError must be a non-empty string, got: ${typeof expectedError} (${expectedError})`);
    }
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(`fieldName must be a non-empty string, got: ${typeof fieldName} (${fieldName})`);
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    logger.debug('Reading custom validation error below reference field', { fieldName, expectedError });
    const actualError = await dynamicFieldsPage.getReferenceFieldCustomError(fieldName);

    expect(
      actualError,
      `Expected the custom error below the "${fieldName}" reference field to contain "${expectedError}", but got "${actualError}"`
    ).toContain(expectedError);
  },

  /**
   * Verifies the mandatory Financial Reference was enforced on submit — i.e. its dropdown is flagged
   * invalid because it was left empty.
   *
   * Distinct from verifyFinancialReferenceMandatoryMarker, which asserts the static "*" required
   * marker on the section header and is true from the moment the popup opens. This asserts the
   * post-submit rejection. It cannot be expressed with the custom-error verifiers: financial-reference.vue
   * renders no validation-message node, so the field shows a red border and no "This field is required"
   * text (the reason the original recording found only three such messages, not four).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyFinancialReferenceInvalidState(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyFinancialReferenceInvalidState] "page" is required.');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Verifying the Financial Reference dropdown is flagged invalid after submit');
    await dynamicFieldsPage.waitForFinancialReferenceErrorState();
  },

  /**
   * Verifies that a validation error is displayed below ONE named traveller's reference/dynamic field.
   * Param order mirrors verifyReferenceFieldCustomError (expected error first, field second) with the
   * traveller appended, matching the Gherkin word order.
   *
   * Needed wherever the field label repeats per passenger: the unscoped verifier resolves `.first()`,
   * so asserting the guest primary's mandatory-field error would instead inspect the first traveller's
   * copy — which may be pre-filled and correctly show no error, making the assertion unpassable.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedError - Expected error text (e.g. "This field is required")
   * @param {string} fieldName - Field label (e.g. "Payment Group")
   * @param {string} travellerName - Traveller full name (e.g. "Israel Israeli")
   * @returns {Promise<void>}
   */
  async verifyTravellerReferenceFieldCustomError(page, expectedError, fieldName, travellerName) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyTravellerReferenceFieldCustomError] "page" is required.');
    if (!expectedError || typeof expectedError !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldCustomError] "expectedError" must be a non-empty string, got: ${typeof expectedError} (${expectedError})`
      );
    }
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldCustomError] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }
    if (!travellerName || typeof travellerName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldCustomError] "travellerName" must be a non-empty string, got: ${typeof travellerName} (${travellerName})`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Reading validation error below a traveller-scoped reference field', { travellerName, fieldName, expectedError });
    const actualError = await dynamicFieldsPage.getTravellerReferenceFieldError(travellerName, fieldName);

    expect(
      actualError,
      `Expected the error below the "${fieldName}" reference field of traveller "${travellerName}" to contain ` +
      `"${expectedError}", but got "${actualError}"`
    ).toContain(expectedError);
  },

  /**
   * Verifies that NO validation error is triggered for the reference field after a value is entered.
   * Regression guard for test 55092: reference-field text that contains spaces must not raise a
   * false "This field is required" error. Fails, listing the offending message(s), if any validation
   * error is visible.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyNoReferenceFieldValidationError(page) {
    if (!page) throw new Error('page is required');

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const errors = await dynamicFieldsPage.getVisibleValidationErrors();

    logger.debug('Checked for reference-field validation errors', { errors });
    expect(
      errors,
      `Expected no validation error to be triggered for the reference field after entering text, ` +
      `but found: ${errors.join(' | ')}`
    ).toHaveLength(0);
  },

  /**
   * Fills a TEXT reference field in the reference-fields popup, identified by its label, with the given
   * value. Distinct from fillCheckoutReferenceField (checkout form): this targets the search-gating /
   * "At User Select" popup and blurs after filling so the field's custom-regex validation fires on entry.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} fieldName - The field label as written in the feature (may include a leading "* ")
   * @param {string} value - The value to enter
   * @returns {Promise<void>}
   */
  async fillPopupReferenceField(page, fieldName, value) {
    if (!page) throw new Error('[DynamicAndReferenceFields.fillPopupReferenceField] "page" is required.');
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.fillPopupReferenceField] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }
    if (value === undefined || value === null) {
      throw new Error('[DynamicAndReferenceFields.fillPopupReferenceField] "value" is required.');
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Filling reference field in the popup', { fieldName, value });
    await dynamicFieldsPage.fillPopupReferenceFieldByLabel(fieldName, String(value));
  },

  /**
   * Verifies that a validation error is displayed on the Nth reference field in the reference-fields
   * popup (1-based index, matching the field order in the feature). Fails if no error is visible on that
   * field — e.g. the custom regular-expression validation did not reject the entered value.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string|number} index - 1-based position of the reference field (e.g. "1", "2")
   * @returns {Promise<void>}
   */
  async verifyValidationErrorOnPopupReferenceField(page, index) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyValidationErrorOnPopupReferenceField] "page" is required.');
    const parsed = Number.parseInt(index, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyValidationErrorOnPopupReferenceField] "index" must be a 1-based positive ` +
        `integer, got: ${typeof index} (${index})`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Verifying validation error on popup reference field by index', { index: parsed });
    const visible = await dynamicFieldsPage.isValidationErrorVisibleOnPopupFieldByIndex(parsed);

    expect(
      visible,
      `[DynamicAndReferenceFields.verifyValidationErrorOnPopupReferenceField] Expected a validation error to be ` +
      `displayed on reference field #${parsed} in the popup after entering an invalid-format value, but none was ` +
      `visible. The field's custom regular-expression validation may not have rejected the value, or the field ` +
      `did not render.`
    ).toBe(true);
  },

  /**
   * Verifies that a message is displayed inside the reference-fields popup — e.g. the "Please fill in the
   * required information in order to proceed" instruction that remains shown after clicking Proceed with
   * invalid/missing values (i.e. the popup did not proceed).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} message - The expected message text
   * @returns {Promise<void>}
   */
  async verifyPopupReferenceFieldMessage(page, message) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyPopupReferenceFieldMessage] "page" is required.');
    if (!message || typeof message !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyPopupReferenceFieldMessage] "message" must be a non-empty string, got: ${typeof message} (${message})`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Verifying message displayed in reference-fields popup', { message });
    const visible = await dynamicFieldsPage.isPopupMessageDisplayed(message);

    expect(
      visible,
      `[DynamicAndReferenceFields.verifyPopupReferenceFieldMessage] Expected the message "${message}" to be displayed ` +
      `in the reference-fields popup, but it was not visible. The popup may have proceeded/closed, or the message ` +
      `text differs.`
    ).toBe(true);
  },

  /**
   * Attempts to select the mandatory reference field's option in the open reference-fields popup —
   * expanding any collapse-section first, then committing the first option of its el-select. When the
   * field is configured "mandatory and blocked from editing" the dropdown is disabled and nothing is
   * selected (the caller then asserts the blocked message persists); when it is an ordinary selectable
   * field the option is committed so the popup can proceed. Best-effort by design: a blocked/absent
   * field returns without throwing.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{ selected: boolean, reason?: string }>}
   */
  async selectMandatoryReferenceFieldOptionInPopup(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.selectMandatoryReferenceFieldOptionInPopup] "page" is required.');
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Selecting the mandatory reference field option in the reference-fields popup');
    const result = await dynamicFieldsPage.selectMandatoryReferenceFieldOption();
    logger.info('Mandatory reference field option selection attempted', result);
    return result;
  },

  /**
   * Clicks "Edit" in the open reference-fields popup so its reference and dynamic fields become
   * editable. Needed for the trip-overview Trip reference form, which opens read-only after booking.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickEditOnReferenceFieldsPopup(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.clickEditOnReferenceFieldsPopup] "page" is required.');

    logger.debug('Clicking Edit on the reference-fields popup to make the fields editable');
    try {
      const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
      await dynamicFieldsPage.clickEditOnReferenceFieldsPopup();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.clickEditOnReferenceFieldsPopup] Failed to switch the reference-fields popup ` +
        `into edit mode: ${err.message}`
      );
    }
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

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    // Submit via Proceed (cart flow) or Save (request-assistance Trip Reference Form) — whichever exists.
    await dynamicFieldsPage.submitReferenceFieldsPopup();
  },

  /**
   * Verifies that the request-assistance reference fields are displayed in the given order, matching
   * the admin-configured field order. Reads the general-questions field labels in DOM order (which is
   * the configured order) and asserts each expected label appears at its expected position. Polls
   * because the labels settle a beat after the reference-fields popup opens. Uses a case-insensitive
   * contains match per position so a trailing tooltip marker or minor punctuation does not cause a
   * false order failure; missing/reordered fields still fail with a full expected-vs-actual listing.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} expectedLabels - Field labels in the expected (admin-configured) order
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldOrder(page, expectedLabels) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldOrder] "page" is required.');
    if (!Array.isArray(expectedLabels) || expectedLabels.length === 0) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceFieldOrder] "expectedLabels" must be a non-empty array, got: ${typeof expectedLabels}`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    logger.debug('Verifying request-assistance reference-field order', { expectedLabels });

    // The general-questions articles render in configured order, but their labels settle a beat after
    // the reference-fields popup opens — poll until at least the expected number of labels rendered.
    await expect
      .poll(async () => (await dynamicFieldsPage.getGeneralReferenceFieldLabelsInOrder().catch(() => [])).length, {
        timeout: 30000,
        message:
          `[DynamicAndReferenceFields.verifyReferenceFieldOrder] Expected at least ${expectedLabels.length} ` +
          `reference field(s) to render in the request-assistance popup, but fewer appeared. The popup may not ` +
          `have opened after sending the request, or the reference fields did not render.`,
      })
      .toBeGreaterThanOrEqual(expectedLabels.length);

    const actualOrder = await dynamicFieldsPage.getGeneralReferenceFieldLabelsInOrder();

    const expectedList = expectedLabels.map((l, i) => `  ${i + 1}. ${l}`).join('\n');
    const actualList = actualOrder.map((l, i) => `  ${i + 1}. ${l}`).join('\n');

    // Strict count: the popup must show EXACTLY the expected fields. Without this, an extra field
    // appended AFTER the last expected position would slip past the position-by-position check below
    // (which only inspects positions 1..N). A field removed BEFORE position N is already caught by the
    // poll above never reaching N.
    expect(
      actualOrder.length,
      `[DynamicAndReferenceFields.verifyReferenceFieldOrder] Expected exactly ${expectedLabels.length} ` +
      `request-assistance reference field(s), but found ${actualOrder.length}.\n` +
      `Expected order:\n${expectedList}\nActual order:\n${actualList}`
    ).toBe(expectedLabels.length);

    const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const mismatches = [];
    expectedLabels.forEach((expected, i) => {
      const actual = actualOrder[i] || '';
      if (!normalize(actual).includes(normalize(expected))) {
        mismatches.push(`  position ${i + 1}: expected "${expected}", got "${actual || '(missing)'}"`);
      }
    });

    expect(
      mismatches.length,
      `[DynamicAndReferenceFields.verifyReferenceFieldOrder] Request-assistance reference fields are not in the ` +
      `admin-configured order.\nExpected order:\n${expectedList}\nActual order:\n${actualList}\nMismatches:\n${mismatches.join('\n')}`
    ).toBe(0);
  },

  /**
   * Verifies ONE traveller's section of the Travellers Reference Questions shows exactly the expected
   * reference fields — no more, no fewer. Used for fields with a display condition (e.g. shown only
   * when the traveller has a PAR profile, or only for guests): the strict set check proves each
   * conditional field appears for the travellers it applies to AND is hidden for the others.
   * Comparison is order-independent, whitespace-normalized and case-insensitive (the popup
   * capitalizes labels via CSS).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} travellerName - Traveller name as shown in the passenger header (e.g. "Jonathan Taylor")
   * @param {string[]} expectedLabels - The reference field labels that traveller should see
   * @returns {Promise<{travellerName: string, labels: string[]}>} The labels read from the traveller's section
   */
  async verifyTravellerReferenceFieldLabelsExactly(page, travellerName, expectedLabels) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyTravellerReferenceFieldLabelsExactly] "page" is required.');
    if (!travellerName || typeof travellerName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldLabelsExactly] "travellerName" must be a non-empty string, got: ${typeof travellerName}`
      );
    }
    if (!Array.isArray(expectedLabels) || expectedLabels.length === 0) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldLabelsExactly] "expectedLabels" must be a non-empty array, got: ${typeof expectedLabels}`
      );
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const expected = sortAlphabetically(expectedLabels.map(normalize));

    logger.debug('Verifying traveller reference field labels', { travellerName, expectedLabels });

    // The passenger sections expand with an animation and their fields settle a beat after the popup
    // opens — poll the traveller's label set until it matches, then report the last read on failure.
    let actual = [];
    await expect
      .poll(async () => {
        actual = await dynamicFieldsPage.getTravellerReferenceFieldLabels(travellerName);
        return sortAlphabetically(actual.map(normalize));
      }, {
        timeout: 30000,
        message:
          `[DynamicAndReferenceFields.verifyTravellerReferenceFieldLabelsExactly] Traveller "${travellerName}" should see ` +
          `exactly these reference fields: [${expectedLabels.join(', ')}]. A missing field means its display condition ` +
          `did not match this traveller; an extra field means a conditional field leaked into their section.`,
      })
      .toEqual(expected);

    logger.info('Traveller reference field labels match', { travellerName, labels: actual });
    return { travellerName, labels: actual };
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

  /**
   * Opens the reference-field dropdown under test and types filterText to narrow its options,
   * leaving the dropdown OPEN so the following steps can assert the filtered option is shown and
   * select it. Drives the "reference field dropdown is filterable by typing" flow (test 57324),
   * where the step carries no field name \u2014 the first visible dropdown is the field under test.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} filterText - Text to type to filter the dropdown (e.g. "dulux")
   * @returns {Promise<void>}
   */
  async filterReferenceFieldDropdownByTyping(page, filterText) {
    if (!page) throw new Error('[DynamicAndReferenceFields.filterReferenceFieldDropdownByTyping] "page" is required.');
    if (!filterText || typeof filterText !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.filterReferenceFieldDropdownByTyping] "filterText" must be a non-empty ` +
        `string, got: ${typeof filterText} (${filterText})`
      );
    }
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    await dynamicFieldsPage.filterReferenceFieldDropdown(filterText);
  },

  /**
   * Verifies that an option matching optionText is displayed in the open reference-field dropdown
   * after filtering by typing \u2014 i.e. the filter narrowed the list to the expected option.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} optionText - The expected option label (e.g. "DULUX 6102030120")
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldDropdownOptionDisplayed(page, optionText) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldDropdownOptionDisplayed] "page" is required.');
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceFieldDropdownOptionDisplayed] "optionText" must be a ` +
        `non-empty string, got: ${typeof optionText} (${optionText})`
      );
    }
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    const visible = await dynamicFieldsPage.isDropdownOptionVisible(optionText);
    expect(
      visible,
      `[DynamicAndReferenceFields.verifyReferenceFieldDropdownOptionDisplayed] Expected the filtered ` +
      `reference-field dropdown option "${optionText}" to be displayed after typing, but it was not visible. ` +
      `The dropdown may not be open, the typed filter text may not match this option, or the option label differs.`
    ).toBe(true);
  },

  /**
   * Selects the option matching optionText from the open reference-field dropdown (after it was
   * filtered by typing). Commits the selection into the field.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} optionText - The option label to select (e.g. "DULUX 6102030120")
   * @returns {Promise<void>}
   */
  async selectReferenceFieldDropdownOption(page, optionText) {
    if (!page) throw new Error('[DynamicAndReferenceFields.selectReferenceFieldDropdownOption] "page" is required.');
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.selectReferenceFieldDropdownOption] "optionText" must be a non-empty ` +
        `string, got: ${typeof optionText} (${optionText})`
      );
    }
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    await dynamicFieldsPage.selectOpenDropdownOption(optionText);
  },

  /**
   * Verifies a reference-fields popup with the given title (e.g. "New trip reference fields", the
   * search-stage popup) is open. Polls the visible dialog titles because the popup opens a beat after
   * the triggering search click.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedTitle - The popup title
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldsPopupDisplayed(page, expectedTitle) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldsPopupDisplayed] "page" is required.');
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceFieldsPopupDisplayed] "expectedTitle" must be a non-empty ` +
        `string, got: ${typeof expectedTitle} (${expectedTitle})`
      );
    }
    const commonPage = getPageObject(page, CommonPage);
    const wanted = expectedTitle.trim().toLowerCase();
    let titles = [];
    await expect
      .poll(
        async () => {
          titles = await commonPage.getVisibleDialogTitles();
          return titles.some((t) => t.toLowerCase() === wanted);
        },
        { timeout: 30000 }
      )
      .toBe(true)
      .catch(() => {
        throw new Error(
          `[DynamicAndReferenceFields.verifyReferenceFieldsPopupDisplayed] Expected the "${expectedTitle}" popup ` +
          `to be displayed, but the visible dialogs were: ${titles.length ? titles.join(', ') : '(none)'}`
        );
      });
  },

  /**
   * Opens the single reference-field dropdown under test (the first visible one) and leaves its option
   * panel open for the following option-order assertions.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async openReferenceFieldDropdown(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.openReferenceFieldDropdown] "page" is required.');
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    await dynamicFieldsPage.openFirstReferenceFieldDropdown();
  },

  /**
   * Reads the option labels of the open reference-field dropdown in display order, polling until the
   * panel has rendered at least one option. Throws when the panel stays empty — an order assertion on
   * an empty list would pass vacuously.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string[]>}
   */
  async _readOpenReferenceFieldDropdownOptions(page) {
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    let options = [];
    await expect
      .poll(async () => {
        options = await dynamicFieldsPage.getOpenDropdownOptionTexts();
        return options.length;
      }, { timeout: 10000 })
      .toBeGreaterThan(0)
      .catch(() => {
        throw new Error(
          '[DynamicAndReferenceFields._readOpenReferenceFieldDropdownOptions] The reference-field dropdown ' +
          'shows no options. It may not be open — run "I open the reference field dropdown" first.'
        );
      });
    return options;
  },

  /**
   * Verifies the open reference-field dropdown lists its options in alphabetical order
   * (case-insensitive, locale-aware), regardless of the order they were configured in admin.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldDropdownOptionsSortedAlphabetically(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldDropdownOptionsSortedAlphabetically] "page" is required.');
    const options = await this._readOpenReferenceFieldDropdownOptions(page);
    expect(
      options.length,
      '[DynamicAndReferenceFields.verifyReferenceFieldDropdownOptionsSortedAlphabetically] Need at least two ' +
      `dropdown options to verify their order, got: ${JSON.stringify(options)}`
    ).toBeGreaterThan(1);
    const sorted = sortAlphabetically(options);
    logger.info('Reference-field dropdown options', { options });
    expect(
      options,
      '[DynamicAndReferenceFields.verifyReferenceFieldDropdownOptionsSortedAlphabetically] Dropdown options are ' +
      `not sorted alphabetically. Displayed: ${JSON.stringify(options)}, expected: ${JSON.stringify(sorted)}`
    ).toEqual(sorted);
  },

  /**
   * Verifies that a reference-questions section with the given title is displayed at checkout — e.g.
   * the "Travellers Reference Questions" section that groups each traveller's dynamic/reference fields.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} sectionTitle - The section header text (e.g. "Travellers Reference Questions")
   * @returns {Promise<void>}
   */
  async verifyReferenceSectionDisplayed(page, sectionTitle) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceSectionDisplayed] "page" is required.');
    if (!sectionTitle || typeof sectionTitle !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceSectionDisplayed] "sectionTitle" must be a non-empty string, got: ${typeof sectionTitle} (${sectionTitle})`
      );
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await checkoutPage.waitForBookingDetailsText();

    logger.debug('Verifying reference section is displayed at checkout', { sectionTitle });
    const visible = await dynamicFieldsPage.isReferenceSectionTitleDisplayed(sectionTitle);
    expect(
      visible,
      `[DynamicAndReferenceFields.verifyReferenceSectionDisplayed] Expected the "${sectionTitle}" reference section ` +
      `to be displayed at checkout, but its header was not visible. The per-traveller reference-questions section ` +
      `may not have rendered, or the title text differs from "${sectionTitle}".`
    ).toBe(true);
  },

  /**
   * Verifies that the given field labels are shown for a specific traveller in the Travellers Reference
   * Questions section at checkout (e.g. traveller "Gadi Cohen" shows "Payment Group" and "Bank account").
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} travellerName - Traveller full name as shown in the passenger header
   * @param {string[]} fields - Field labels expected in that traveller's section
   * @returns {Promise<void>}
   */
  async verifyTravellerReferenceFieldsShown(page, travellerName, fields) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyTravellerReferenceFieldsShown] "page" is required.');
    if (!travellerName || typeof travellerName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyTravellerReferenceFieldsShown] "travellerName" must be a non-empty string, got: ${typeof travellerName} (${travellerName})`
      );
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('[DynamicAndReferenceFields.verifyTravellerReferenceFieldsShown] "fields" must be a non-empty array.');
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await checkoutPage.waitForBookingDetailsText();

    logger.debug('Verifying per-traveller reference fields at checkout', { travellerName, fields });
    const results = await dynamicFieldsPage.travellerSectionFieldLabelPresence(travellerName, fields);
    const missing = results.filter((r) => !r.present).map((r) => r.label);

    expect(
      missing,
      `[DynamicAndReferenceFields.verifyTravellerReferenceFieldsShown] The Travellers Reference Questions for ` +
      `"${travellerName}" should show fields [${fields.join(', ')}], but these were not found: [${missing.join(', ')}]. ` +
      `The traveller's section may not have rendered these dynamic fields, or the label text differs.`
    ).toHaveLength(0);
  },

  /**
   * Verifies that every expected value appears among the reference field values shown in the Travellers
   * Reference Questions section at checkout (dropdown selected values + free-text field values). The
   * expected values are an unordered set — e.g. ACC/ADD (Payment Group dropdowns) and 456/11 (Bank
   * account textboxes) across two travellers. Polls because dropdown values load asynchronously from
   * each traveller's profile after the section renders.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} expectedValues - Values that must all be present in the section
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldValuesPresent(page, expectedValues) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldValuesPresent] "page" is required.');
    if (!Array.isArray(expectedValues) || expectedValues.length === 0) {
      throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldValuesPresent] "expectedValues" must be a non-empty array.');
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);

    await checkoutPage.waitForBookingDetailsText();

    logger.debug('Verifying reference field values at checkout', { expectedValues });

    const isPresent = (actualValues, expected) =>
      actualValues.some((actual) => actual.toLowerCase().includes(String(expected).toLowerCase()));

    let actualValues = [];
    try {
      await expect
        .poll(
          async () => {
            actualValues = await dynamicFieldsPage.getAllTravellerReferenceFieldValues();
            return expectedValues.filter((ev) => isPresent(actualValues, ev)).length;
          },
          {
            timeout: 25000,
            message:
              `[DynamicAndReferenceFields.verifyReferenceFieldValuesPresent] Expected all reference field values ` +
              `[${expectedValues.join(', ')}] to appear in the Travellers Reference Questions section at checkout.`,
          }
        )
        .toBe(expectedValues.length);
    } catch {
      const missing = expectedValues.filter((ev) => !isPresent(actualValues, ev));
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceFieldValuesPresent] Reference field values mismatch at checkout. ` +
        `Expected all of [${expectedValues.join(', ')}] to be present; missing [${missing.join(', ')}]. ` +
        `Actual values found: [${actualValues.join(', ')}].`
      );
    }
  },

  /**
   * Edits the editable free-text reference field values in the Travellers Reference Questions section
   * at checkout, in order (e.g. sets the two "Bank account" fields — one per traveller — to new values).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} values - New values, one per editable textbox field in DOM order
   * @returns {Promise<void>}
   */
  async editReferenceFieldTextValues(page, values) {
    if (!page) throw new Error('[DynamicAndReferenceFields.editReferenceFieldTextValues] "page" is required.');
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('[DynamicAndReferenceFields.editReferenceFieldTextValues] "values" must be a non-empty array.');
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Editing reference field textbox values at checkout', { values });
    await dynamicFieldsPage.fillTravellerReferenceTextboxes(values);
  },

  /**
   * Verifies that the editable free-text reference fields in the Travellers Reference Questions section
   * were updated to the expected values, matched positionally in DOM order.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} expectedValues - Expected values, one per editable textbox field in DOM order
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldTextValuesUpdated(page, expectedValues) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldTextValuesUpdated] "page" is required.');
    if (!Array.isArray(expectedValues) || expectedValues.length === 0) {
      throw new Error('[DynamicAndReferenceFields.verifyReferenceFieldTextValuesUpdated] "expectedValues" must be a non-empty array.');
    }

    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    logger.debug('Verifying reference field textbox values updated at checkout', { expectedValues });

    let actualValues = [];
    try {
      await expect
        .poll(
          async () => {
            actualValues = await dynamicFieldsPage.getTravellerReferenceTextboxValues();
            return expectedValues.every((ev, idx) => (actualValues[idx] || '') === String(ev));
          },
          {
            timeout: 10000,
            message:
              `[DynamicAndReferenceFields.verifyReferenceFieldTextValuesUpdated] Expected the edited reference field ` +
              `values to become [${expectedValues.join(', ')}].`,
          }
        )
        .toBe(true);
    } catch {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceFieldTextValuesUpdated] Reference field values were not updated as ` +
        `expected. Expected [${expectedValues.join(', ')}], got [${actualValues.join(', ')}]. The edit may not have ` +
        `committed, or a validation error blocked the new value.`
      );
    }
  },

  /**
   * Clicks the hyperlink embedded in a reference-field description in the open reference-fields popup.
   * The link opens the linked page in a NEW browser tab; returns that tab so the caller (step) can store
   * it on the World for a later "opens the linked page" step to verify (test 73097).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<import('playwright').Page>} The newly opened tab
   */
  async clickReferenceFieldHyperlink(page) {
    if (!page) throw new Error('[DynamicAndReferenceFields.clickReferenceFieldHyperlink] "page" is required.');
    logger.debug('Clicking the reference-field hyperlink in the reference-fields popup');
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    try {
      return await dynamicFieldsPage.clickReferenceFieldHyperlink();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.clickReferenceFieldHyperlink] Could not open the reference-field hyperlink. ` +
        `The reference-fields popup may not be showing a linked field. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies that a previously-opened tab (captured when a hyperlink was clicked) landed on that link's
   * target page. Reference-field, push-note and cart-notification hyperlinks each open an external URL
   * that is admin-configured and varies per surface/profile (a Google search, a sports site, etc.), so
   * verification keys off the clicked link's OWN href — never a hardcoded site. Matches on the
   * registrable host (leading "www." stripped) so a http→https upgrade, trailing slash, or path/query on
   * the opened tab still counts as "opened the linked page". Polls to absorb the about:blank → target
   * navigation. Shared by every "... opens the linked page" step (test 73097).
   *
   * @param {import('playwright').Page} linkedPage - The tab opened by the hyperlink click
   * @param {string} expectedHref - The href of the clicked link (captured before the click)
   * @param {import('playwright').Page} [mainPage] - The app page to return focus to after verifying
   * @returns {Promise<void>}
   */
  async verifyLinkedPageOpened(linkedPage, expectedHref, mainPage) {
    if (!linkedPage) {
      throw new Error(
        '[DynamicAndReferenceFields.verifyLinkedPageOpened] "linkedPage" is required — no opened tab was stored. ' +
        'Ensure the hyperlink-click step ran first.'
      );
    }
    let expectedHost = null;
    if (expectedHref && typeof expectedHref === 'string') {
      try {
        expectedHost = new URL(expectedHref).hostname.replace(/^www\./i, '').toLowerCase();
      } catch {
        expectedHost = null;
      }
    }
    logger.debug('Verifying the hyperlink opened the linked page', { expectedHref, expectedHost });
    try {
      if (expectedHost) {
        await expect
          .poll(() => linkedPage.url().toLowerCase(), {
            timeout: 30000,
            message:
              `Expected the hyperlink to open its linked page (host "${expectedHost}", from href "${expectedHref}") ` +
              `in a new tab, but the opened tab URL never matched.`,
          })
          .toContain(expectedHost);
      } else {
        // No parseable href was captured — fall back to asserting the tab navigated to a real external
        // page (i.e. it left about:blank for an http(s) URL), which still proves the hyperlink opened.
        await expect
          .poll(() => linkedPage.url(), {
            timeout: 30000,
            message:
              `Expected the hyperlink to open an external linked page in a new tab, but the opened tab never ` +
              `navigated to an http(s) URL (captured href was "${expectedHref}").`,
          })
          .toMatch(/^https?:\/\/.+/);
      }
    } finally {
      // Close the linked tab and return focus to the app page. A target="_blank" click leaves the new
      // tab in the foreground; if it stays open, the next action runs against a backgrounded app page,
      // which can throttle the app and swallow interactions (e.g. Proceed then fails to dismiss a popup).
      await linkedPage.close().catch(() => {});
      if (mainPage) {
        await mainPage.bringToFront().catch(() => {});
      }
    }
  },

  /**
   * Verifies the checkout question section titled sectionTitle (e.g. "General Reference Questions",
   * "Travellers Reference Questions") shows every given field label. Scoped to that one section, so a
   * field configured for a different section does not satisfy the check — the point of "show only in
   * case" conditions is WHERE a field lands as much as whether it lands. Polls because the sections
   * mount asynchronously after the "Booking details" heading.
   *
   * @param {import('playwright').Page} page
   * @param {string} sectionTitle
   * @param {string[]} labels - Field labels that must be shown in the section (case-insensitive)
   * @returns {Promise<{labels: string[]}>} The labels the section displayed
   */
  async verifyReferenceSectionShowsFields(page, sectionTitle, labels) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceSectionShowsFields] "page" is required.');
    if (!sectionTitle || typeof sectionTitle !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceSectionShowsFields] "sectionTitle" must be a non-empty string, got: ${typeof sectionTitle} (${sectionTitle})`
      );
    }
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error('[DynamicAndReferenceFields.verifyReferenceSectionShowsFields] "labels" must be a non-empty array.');
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    await checkoutPage.waitForBookingDetailsText();

    const missingFrom = (shown) => {
      const shownLower = shown.map((s) => s.toLowerCase());
      return labels.filter((label) => !shownLower.includes(label.toLowerCase()));
    };

    try {
      await expect
        .poll(async () => missingFrom(await dynamicFieldsPage.getReferenceSectionFieldLabels(sectionTitle)), {
          timeout: 20000,
        })
        .toHaveLength(0);
    } catch (err) {
      const shown = await dynamicFieldsPage.getReferenceSectionFieldLabels(sectionTitle);
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceSectionShowsFields] The "${sectionTitle}" section should show ` +
        `[${labels.join(', ')}], but these are missing: [${missingFrom(shown).join(', ')}]. The section shows: ` +
        `[${shown.join(', ') || 'none — the section is not rendered'}]. Original: ${err.message}`
      );
    }

    const shown = await dynamicFieldsPage.getReferenceSectionFieldLabels(sectionTitle);
    logger.info('Reference section shows the expected fields', { sectionTitle, labels, shown });
    return { labels: shown };
  },

  /**
   * Verifies the checkout question section titled sectionTitle does NOT show any of the given field
   * labels. Waits for the section to render its fields first: reading an empty, half-mounted section
   * would pass vacuously. The section must therefore show at least one field — pair this with
   * verifyReferenceSectionShowsFields for the same section.
   *
   * @param {import('playwright').Page} page
   * @param {string} sectionTitle
   * @param {string[]} labels - Field labels that must NOT be shown in the section (case-insensitive)
   * @returns {Promise<{labels: string[]}>} The labels the section displayed
   */
  async verifyReferenceSectionDoesNotShowFields(page, sectionTitle, labels) {
    if (!page) throw new Error('[DynamicAndReferenceFields.verifyReferenceSectionDoesNotShowFields] "page" is required.');
    if (!sectionTitle || typeof sectionTitle !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceSectionDoesNotShowFields] "sectionTitle" must be a non-empty string, got: ${typeof sectionTitle} (${sectionTitle})`
      );
    }
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error('[DynamicAndReferenceFields.verifyReferenceSectionDoesNotShowFields] "labels" must be a non-empty array.');
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    const dynamicFieldsPage = getPageObject(page, DynamicAndReferenceFieldsPage);
    await checkoutPage.waitForBookingDetailsText();

    try {
      await expect
        .poll(async () => (await dynamicFieldsPage.getReferenceSectionFieldLabels(sectionTitle)).length, { timeout: 20000 })
        .toBeGreaterThan(0);
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFields.verifyReferenceSectionDoesNotShowFields] The "${sectionTitle}" section rendered no ` +
        `fields, so the absence of [${labels.join(', ')}] cannot be told apart from a section that never loaded. ` +
        `Original: ${err.message}`
      );
    }

    const shown = await dynamicFieldsPage.getReferenceSectionFieldLabels(sectionTitle);
    const shownLower = shown.map((s) => s.toLowerCase());
    const leaked = labels.filter((label) => shownLower.includes(label.toLowerCase()));
    expect(
      leaked,
      `[DynamicAndReferenceFields.verifyReferenceSectionDoesNotShowFields] The "${sectionTitle}" section should not ` +
      `show [${labels.join(', ')}], but it shows: [${leaked.join(', ')}]. All labels in the section: [${shown.join(', ')}].`
    ).toHaveLength(0);

    logger.info('Reference section hides the given fields', { sectionTitle, labels, shown });
    return { labels: shown };
  },

};

// Export DynamicAndReferenceFields DSL for use in tests
module.exports = DynamicAndReferenceFields;
