/**
 * Page Object for dynamic and reference fields page.
 * Contains only UI-level interactions.
 */

const { EL_SELECT_DISABLED_INNER } = require("@utils/elementPlus");

const SELECTORS = {
  REFERENCE_FIELD_SECTION: '.general-section',
  TRAVELER_FIELD_SECTION: '.traveler-section',
  INPUT_WRAPPER: '.el-input__wrapper',
  INPUT_INNER: '.el-input__inner',
  SAVE_BUTTON_MODAL: '.el-dialog__footer button:has-text("Save")',
  FIELD_LABEL: 'label.label',
  FIELD_CONTAINER: '.input-dropdown, .input-textbox, .input-checkbox, .input-autocomplete, .input-textarea',
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
  // Mandatory "*" marker on the Financial Reference collapse header (trip-app.vue:
  // <span class="ml-2 has-text-danger mr-1">*</span>). Its presence marks the section as required.
  FINANCIAL_REFERENCE_MANDATORY_MARKER: '.financial-section span.has-text-danger',
  // Open reference-fields dialog (trip-app.vue el-dialog) used to scope field counts.
  REFERENCE_DIALOG: '.el-dialog:visible',
  // Footer buttons inside the open reference-fields dialog (trip-app.vue `.app-footer`), e.g.
  // "Proceed"/"Save" (submit) or "Back"/"Close" (dismiss). Scope by button text at the call site.
  REFERENCE_DIALOG_FOOTER_BUTTON: '.app-footer button',
  // Collapsible section inside the reference-fields popup (e.g. "Financial Reference"). Some
  // reference "fields" render as a collapse section (title + its own el-select) rather than a
  // `label.label` / `.input-*` container, so label lookups fall back to these when no field matches.
  COLLAPSE_SECTION_HEADER: '.el-collapse-item__header',
  COLLAPSE_SECTION_ITEM: '.el-collapse-item',
  // Per-traveller dynamic/reference question block at checkout (traveler-reference-field.vue renders
  // one `section.traveler-questions` inside each passenger's collapse-item under `section.traveler-section`).
  // Counting these blocks that contain a given field label yields how many travellers show that field.
  TRAVELER_QUESTIONS: '.traveler-section .traveler-questions',
  // One field label per configured general reference field, in admin-configured order: the
  // general-reference-field component renders `.general-questions` with one `<article>` per field
  // (v-for over generalQuestions), each carrying a single `label.label` (FIELD_LABEL).
  GENERAL_QUESTIONS_LABEL: '.general-questions article label.label',
  // Filterable reference-field dropdown (input-dropdown.vue renders an `.el-select` with `filterable`).
  // Used by the "dropdown is filterable by typing" flow: open the dropdown, type to narrow the list,
  // then read/select the matching item from the OPEN dropdown panel.
  FIELD_DROPDOWN_CONTAINER: '.input-dropdown',
  EL_SELECT: '.el-select',
  // The currently OPEN el-select option panel. Scope option reads to this so a hidden option panel
  // from another el-select on the page (its popper stays in the DOM) is not matched.
  OPEN_DROPDOWN_PANEL: '.el-select-dropdown:visible',
  DROPDOWN_ITEM: '.el-select-dropdown__item',
  // Per-traveller reference/dynamic field containers at checkout: input-basic renders one per field
  // inside each passenger's `.traveler-questions`. A dropdown field (e.g. "Payment Group") shows its
  // selected value as the el-select's text; a free-text field (e.g. "Bank account") holds its value in
  // an `<input>`. Used to read selected/entered values and to edit the editable textbox fields.
  INPUT_DROPDOWN: '.input-dropdown',
  INPUT_TEXTBOX: '.input-textbox',
  // The `.traveler-questions` block relative to a passenger's own collapse item. This is the unscoped
  // form of TRAVELER_QUESTIONS (which is prefixed with `.traveler-section`) so it can be chained off a
  // single passenger's `.el-collapse-item` to scope field reads to that traveller only.
  TRAVELER_QUESTIONS_BLOCK: '.traveler-questions',
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

    // The checkout reference-field form mounts a beat AFTER "Booking details" and renders hidden
    // responsive duplicates (mobile/desktop). The old `text=<label>`.first() could lock onto a
    // not-yet-rendered or invisible copy and then time out waiting for it to become visible — an
    // intermittent flake. Wait for a VISIBLE container carrying this label to render first, then
    // resolve the field via the hardened, visible-scoped fieldContainerByLabel (exact-label-first
    // with substring fallback) — the same approach getFieldValueByLabel / isFieldDisabled use.
    await this.page
      .locator(SELECTORS.FIELD_CONTAINER)
      .filter({ hasText: labelText, visible: true })
      .first()
      .waitFor({ state: 'visible', timeout: Math.max(timeout, 15000) })
      .catch(() => {});

    const fieldContainer = await this.fieldContainerByLabel(labelText);
    await fieldContainer.waitFor({ state: 'visible', timeout });

    // Text reference fields render an el-input (.el-input__inner) inside the field container.
    const input = fieldContainer.locator(SELECTORS.INPUT_INNER).first();
    await input.scrollIntoViewIfNeeded();
    await input.fill(value);
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
    const substringMatches = this.page.locator(SELECTORS.FIELD_LABEL).filter({ hasText: labelText });
    // Some reference "fields" render as a collapsible SECTION header rather than a `label.label`
    // (e.g. "Financial Reference"), so no field-label match exists — fall back to the section header.
    const sectionHeader = this.page.locator(SELECTORS.COLLAPSE_SECTION_HEADER).filter({ hasText: labelText });

    // The reference-fields form renders asynchronously AFTER the "Booking details" heading, so the
    // requested label may not exist yet when this check starts. Wait for ANY candidate to attach
    // before deciding which locator to assert on — a non-waiting count() snapshot taken on the
    // not-yet-rendered form reports 0 matches, locks onto the section-header fallback, and times
    // out even though the label appears moments later (the next label then passes).
    // exactMatches is a subset of substringMatches (an exact label also contains the substring),
    // so substringMatches already covers both label kinds; union it with the section-header fallback.
    const anyCandidate = substringMatches.or(sectionHeader);
    try {
      await anyCandidate.first().waitFor({ state: 'attached', timeout });
    } catch {
      return false;
    }

    // Prefer a label that matches labelText EXACTLY (ignoring the "*" mandatory marker and "info"
    // icon text the label concatenates) so an exact label like "Location" is not shadowed by a
    // longer label that contains it as a substring (e.g. "Location travel policy"). Fall back to a
    // substring match, then the section header, when no exact label exists.
    let label;
    if ((await exactMatches.count()) > 0) {
      label = exactMatches.first();
    } else if ((await substringMatches.count()) > 0) {
      label = substringMatches.first();
    } else {
      label = sectionHeader.first();
    }
    try {
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
    // Scope every match to VISIBLE containers: the reference-field layout renders hidden responsive
    // duplicates (mobile/desktop), so an unscoped .first() can return an invisible node — the caller's
    // subsequent waitFor({state:'visible'}) then times out. See per-diem-breakdown-expand-scoping.
    const exactMatches = this.page.locator(SELECTORS.FIELD_CONTAINER).filter({
      has: this.page.locator(SELECTORS.FIELD_LABEL).filter({ hasText: exactFieldLabelRegex(labelText) }),
      visible: true,
    });
    if ((await exactMatches.count()) > 0) {
      return exactMatches.first();
    }
    const substringMatches = this.page.locator(SELECTORS.FIELD_CONTAINER).filter({ hasText: labelText, visible: true });
    if ((await substringMatches.count()) > 0) {
      return substringMatches.first();
    }
    // Some reference "fields" render as a collapsible SECTION (e.g. "Financial Reference") rather
    // than a `.input-*` container, so no field container matches. Fall back to the collapse section
    // whose header matches the label — its el-select/control still carries the field value.
    return this.page.locator(SELECTORS.COLLAPSE_SECTION_ITEM).filter({
      has: this.page.locator(SELECTORS.COLLAPSE_SECTION_HEADER).filter({ hasText: labelText }),
      visible: true,
    }).first();
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
    // Element Plus flags a disabled select via `is-disabled` on the .el-select root or its inner
    // nodes (wrapper is-disabled/aria-disabled, or a disabled .el-input). All are descendants of the
    // field container, so one combined count covers them. Inner signals come from the shared
    // EL_SELECT_DISABLED_INNER constant (kept in sync with ProfilePage.isDynamicFieldEditable).
    const disabled = fieldContainer.locator('.el-select.is-disabled, ' + EL_SELECT_DISABLED_INNER);
    if (await disabled.count() > 0) return true;
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
    // The checkout "General Reference Questions" section mounts a beat AFTER the booking-details
    // heading, so the field container may not exist yet when this reader runs. Wait for a VISIBLE
    // container carrying this label to render first — otherwise fieldContainerByLabel snapshots 0
    // matches and falls through to a fallback locator that never appears (5s visible-timeout).
    await this.page
      .locator(SELECTORS.FIELD_CONTAINER)
      .filter({ hasText: labelText, visible: true })
      .first()
      .waitFor({ state: 'visible', timeout: Math.max(timeout, 15000) })
      .catch(() => {});
    const fieldContainer = await this.fieldContainerByLabel(labelText);
    await fieldContainer.waitFor({ state: 'visible', timeout });
    // Try dropdown: get the visible text from the el-select's control area
    const selectWrapper = fieldContainer.locator('.el-select').first();
    if (await selectWrapper.count() > 0) {
      const text = await selectWrapper.innerText();
      if (text) return text.trim();
    }
    // Try text/number input (input-textbox fields): the value is the input's `value`, NOT its
    // innerText — reading `.control` innerText returns "" for inputs, so read the value directly.
    const input = fieldContainer.locator('input.el-input__inner, input').first();
    if (await input.count() > 0) {
      const val = (await input.inputValue().catch(() => '')).trim();
      if (val) return val;
    }
    // Fallback: rendered text in the control area (non-input display fields).
    const controlDiv = fieldContainer.locator('.control').first();
    if (await controlDiv.count() > 0) {
      const text = await controlDiv.innerText();
      if (text) return text.trim();
    }
    return '';
  }

  /**
   * Opens a reference-field dropdown identified by its visible label (the question text) and leaves it
   * OPEN so the option list can be read. Mirrors the open logic of the DSL selectReferenceFieldDropdownOnly
   * flow: locate the `.input-dropdown` container whose label span matches the field name (anchored so
   * "Location" is not shadowed by "Location travel policy"), then click its `.el-select`.
   *
   * @param {string} fieldName - Visible field label / question text (e.g. "Can Edit")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<void>}
   */
  async openReferenceFieldDropdownByLabel(fieldName, { timeout = 15000 } = {}) {
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.openReferenceFieldDropdownByLabel] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }
    const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const labelRegex = new RegExp('^\\s*' + escaped + '\\s*$', 'i');

    // Scope to a VISIBLE `.input-dropdown` whose label span matches exactly — the checkout form renders
    // hidden responsive duplicates, so an unscoped match can lock onto an invisible copy that never opens.
    const container = this.page
      .locator(SELECTORS.FIELD_DROPDOWN_CONTAINER)
      .filter({ has: this.page.locator('label span', { hasText: labelRegex }), visible: true })
      .first();

    try {
      await container.waitFor({ state: 'visible', timeout });
      await container.scrollIntoViewIfNeeded();
      await container.locator(SELECTORS.EL_SELECT).first().click({ timeout: 5000 });
      // Confirm the option panel actually opened before the caller reads options.
      await this.page.locator(SELECTORS.OPEN_DROPDOWN_PANEL).first().waitFor({ state: 'visible', timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.openReferenceFieldDropdownByLabel] Could not open the "${fieldName}" ` +
        `reference-field dropdown (${SELECTORS.FIELD_DROPDOWN_CONTAINER} with label "${fieldName}"). The field may ` +
        `not be visible, its label may differ, or it is disabled and cannot be opened. Original: ${err.message}`
      );
    }
  }

  /**
   * Closes the currently open el-select option panel (Escape) and waits for it to hide, so a lingering
   * popper doesn't overlay/steal focus from the next step.
   * @returns {Promise<void>}
   */
  async closeOpenDropdown() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page
      .locator(SELECTORS.OPEN_DROPDOWN_PANEL)
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => {});
  }

  /**
   * Reads every option label from the currently OPEN el-select panel in one DOM round-trip. Lets a
   * caller assert a set of expected options in memory instead of waiting per-option (a missing option
   * otherwise costs a full visibility timeout each).
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   * @returns {Promise<string[]>} Trimmed, non-empty option labels in DOM order.
   */
  async getOpenDropdownOptionTexts({ timeout = 5000 } = {}) {
    const panel = this.page.locator(SELECTORS.OPEN_DROPDOWN_PANEL).first();
    await panel.waitFor({ state: 'visible', timeout }).catch(() => {});
    const texts = await panel.locator(SELECTORS.DROPDOWN_ITEM).allInnerTexts();
    return texts.map((t) => t.trim()).filter(Boolean);
  }

  /**
   * Reads the custom validation error text rendered below a reference/dynamic field, identified by
   * its label. Custom errors render (ReferenceField input-textbox.vue) inside
   * <form-validation-msg type="error"> as <p class="help">{{ question.errorField }}</p> — read via
   * the shared VALIDATION_ERROR selector scoped to the field's OWN container (fieldContainerByLabel)
   * so a different field's error is not returned.
   *
   * @param {string} labelText - The label text of the field (e.g. "Bank account")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} The trimmed custom error text shown under the field
   */
  async getReferenceFieldCustomError(labelText, { timeout = 10000 } = {}) {
    if (!labelText || typeof labelText !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.getReferenceFieldCustomError] "labelText" must be a non-empty string, got: ${typeof labelText} (${labelText})`
      );
    }
    try {
      const fieldContainer = await this.fieldContainerByLabel(labelText);
      const error = fieldContainer.locator(SELECTORS.VALIDATION_ERROR).first();
      await error.waitFor({ state: 'visible', timeout });
      return (await error.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.getReferenceFieldCustomError] Could not read the custom validation error ` +
        `(selector: ${SELECTORS.VALIDATION_ERROR}) below the "${labelText}" reference field within ${timeout}ms. ` +
        `Likely no validation error is rendered for that field, or the label did not resolve to a field container. ` +
        `Original: ${err.message}`
      );
    }
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
   * Collects the text of every VALIDATION_ERROR message ('.form-validation-msg .help') currently
   * VISIBLE on the page. This is the negative-assertion counterpart to isValidationErrorVisible(),
   * which only inspects .first() — a hidden responsive duplicate rendered first can make that method
   * report "not visible" while a real error shows further down, the wrong basis for a "no error"
   * check. Reference/dynamic fields render <form-validation-msg type="error"> under a v-if that is
   * only true while the field is invalid (see input-textbox.vue), so an empty result means no field
   * is in an error state. The empty-text guard drops any icon-only/placeholder node defensively.
   *
   * @param {object} [options]
   * @param {number} [options.settleMs=1000] - Grace period to let any late-rendering validation
   *   surface before snapshotting, so a negative assertion does not pass prematurely.
   * @returns {Promise<string[]>} Trimmed text of each visible validation error (empty if none)
   */
  async getVisibleValidationErrors({ settleMs = 1000 } = {}) {
    if (settleMs > 0) await this.page.waitForTimeout(settleMs);
    const errors = this.page.locator(SELECTORS.VALIDATION_ERROR).filter({ visible: true });
    const count = await errors.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = (await errors.nth(i).innerText()).trim();
      if (text) texts.push(text);
    }
    return texts;
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
      // Scope to the OPEN dropdown panel: the reference popup renders several el-selects (Type of
      // Trip, Type of Traveller, Location travel policy, …) whose option panels stay in the DOM but
      // hidden. A global `.el-select-dropdown__item` would let `.first()` resolve to a hidden item
      // from a closed panel and time out, so only read items in the visible (open) dropdown.
      const panel = this.page.locator('.el-select-dropdown:visible').first();
      const optionLocator = panel.locator(SELECTORS.FINANCIAL_REFERENCE_DROPDOWN_OPTION);
      await optionLocator.first().waitFor({ state: 'visible', timeout: 10000 });

      // The option list is clipped to a max-height with its own scrollbar, so options past the fold
      // are not returned by a single read. Scroll the dropdown's scroll container to the bottom in
      // steps, accumulating option texts until no new ones appear (order-preserving via a Set).
      const scroller = panel.locator('.el-scrollbar__wrap, .el-select-dropdown__wrap').first();
      const hasScroller = (await scroller.count()) > 0;
      const collected = new Set();
      let stableRounds = 0;
      for (let round = 0; round < 40 && stableRounds < 3; round++) {
        const before = collected.size;
        for (const t of await optionLocator.allInnerTexts()) {
          const trimmed = (t || '').trim();
          if (trimmed) collected.add(trimmed);
        }
        stableRounds = collected.size === before ? stableRounds + 1 : 0;
        if (!hasScroller) break;
        await scroller.evaluate((el) => { el.scrollTop = Math.min(el.scrollTop + el.clientHeight, el.scrollHeight); });
      }
      return Array.from(collected);
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
   * Returns true if the Financial Reference collapse header shows its mandatory "*" marker
   * (the <span class="ml-2 has-text-danger mr-1">*</span> in trip-app.vue), i.e. the section is
   * required. Returns false if the marker never becomes visible within the timeout.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isFinancialReferenceMandatoryMarkerVisible({ timeout = 15000 } = {}) {
    const marker = this.page.locator(SELECTORS.FINANCIAL_REFERENCE_MANDATORY_MARKER).first();
    try {
      await marker.waitFor({ state: 'visible', timeout });
      const text = (await marker.innerText().catch(() => '')).trim();
      return text.includes('*');
    } catch {
      return false;
    }
  }

  /**
   * Opens the financial-reference dropdown and selects the option whose label matches optionText
   * (case-insensitive partial match), e.g. "uploadname4 (uploadcode4)". Used when a SPECIFIC financial
   * reference code must be chosen (selectFirstFinancialReferenceOption picks the first regardless).
   * @param {string} optionText - The financial reference option label to select
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async selectFinancialReferenceOptionByText(optionText, { timeout = 15000 } = {}) {
    if (!optionText || typeof optionText !== 'string') {
      throw new Error('[DynamicAndReferenceFieldsPage.selectFinancialReferenceOptionByText] "optionText" must be a non-empty string, got: ' + typeof optionText);
    }
    await this.waitForFinancialReferenceDropdown({ timeout });
    await this.openFinancialReferenceDropdown();

    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionRegex = new RegExp(escape(optionText), 'i');
    // Scope to the OPEN dropdown panel so a hidden option panel from another el-select isn't matched.
    // Use the enabled-option selector (matches the error message below) so a disabled item can't be clicked.
    const panel = this.page.locator('.el-select-dropdown:visible').first();
    const option = panel.locator(SELECTORS.FINANCIAL_REFERENCE_DROPDOWN_OPTION).filter({ hasText: optionRegex }).first();
    try {
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 5000 });
      // Wait for the dropdown popper to close (selection committed) before the caller proceeds/saves,
      // rather than a fixed sleep.
      await this.page.locator('.el-select-dropdown:visible').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.selectFinancialReferenceOptionByText] Could not select financial reference ` +
        `option "${optionText}" — it was not present/visible in the open dropdown ` +
        `(${SELECTORS.FINANCIAL_REFERENCE_DROPDOWN_OPTION}). Original: ${err.message}`
      );
    }
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

  /**
   * Waits for the reference-fields dialog to render at least one field, then counts the
   * reference/dynamic field containers inside it. Used to assert the exact number of
   * reference + dynamic fields shown on the travel-request popup.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=20000]
   * @returns {Promise<number>} Number of reference/dynamic field containers in the open dialog
   */
  async getReferenceFieldCount({ timeout = 20000 } = {}) {
    const dialog = this.page.locator(SELECTORS.REFERENCE_DIALOG).first();
    try {
      await dialog.waitFor({ state: 'visible', timeout });
      // Count field labels rather than field containers: each reference/dynamic field renders one
      // `label.label`, whereas the container wrapper class varies by field type (dropdown, textbox,
      // checkbox, autocomplete, textarea, basic, ...), so a fixed container list under-counts.
      await dialog.locator(SELECTORS.FIELD_LABEL).first().waitFor({ state: 'visible', timeout });
      const labelledCount = await dialog.locator(SELECTORS.FIELD_LABEL).count();
      // The Financial Reference field renders as a collapse section with its own el-select and no
      // `label.label`, so add it in to reflect the true reference/dynamic field total.
      const financialCount = await dialog.locator(SELECTORS.FINANCIAL_REFERENCE_SECTION).count();
      return labelledCount + financialCount;
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.getReferenceFieldCount] Could not read the reference/dynamic field ` +
        `labels (selector: ${SELECTORS.FIELD_LABEL}) inside the open reference dialog ` +
        `(${SELECTORS.REFERENCE_DIALOG}) within ${timeout}ms. The travel-request popup may not have opened, ` +
        `or no reference fields rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Submits the reference-fields popup. The cart-checkout flow renders a "Proceed" button, whereas
   * the request-assistance "Trip Reference Form" submits via a dialog-footer "Save". Clicks whichever
   * is present (preferring Proceed) so a single step works for both flows.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async submitReferenceFieldsPopup({ timeout = 15000 } = {}) {
    // The submit button lives in the open dialog's `.app-footer` (trip-app.vue) and reads "Proceed"
    // (cart/checkout) or "Save" (request-assistance Trip Reference Form) depending on config, so match
    // either. Scoping to the visible dialog's footer avoids the per-field/financial sub-component Save.
    const dialog = this.page.locator(SELECTORS.REFERENCE_DIALOG).first();
    const submit = dialog.locator(SELECTORS.REFERENCE_DIALOG_FOOTER_BUTTON).filter({ hasText: /^\s*(Proceed|Save)\s*$/ }).first();
    try {
      await submit.waitFor({ state: 'visible', timeout });
      await submit.click({ timeout });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.submitReferenceFieldsPopup] Could not find/click the reference-popup ` +
        `submit button ("Proceed" or "Save") in the open dialog's .app-footer within ${timeout}ms. ` +
        `The reference-fields popup may not be open. Original: ${err.message}`
      );
    }
  }

  /**
   * Dismisses the open reference-fields popup via its footer Back/Close button, returning to the
   * previous page (e.g. the new-trip page) WITHOUT proceeding forward. The dismiss button reads
   * "Close" (trip-app.vue NEW REF footer, shown when `refFieldsOption.isShowBackClose`) or "Back"
   * (OLD REF footer), so match either. Scoping to the visible dialog's `.app-footer` avoids the
   * "Proceed"/"Save" submit and any page-level buttons.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async closeReferenceFieldsPopup({ timeout = 15000 } = {}) {
    const dialog = this.page.locator(SELECTORS.REFERENCE_DIALOG).first();
    const backButton = dialog
      .locator(SELECTORS.REFERENCE_DIALOG_FOOTER_BUTTON)
      .filter({ hasText: /^\s*(Back|Close)\s*$/ })
      .first();
    try {
      await backButton.waitFor({ state: 'visible', timeout });
      await backButton.click({ timeout });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.closeReferenceFieldsPopup] Could not find/click the reference-popup ` +
        `Back/Close button in the open dialog's .app-footer within ${timeout}ms. The reference-fields popup ` +
        `may not be open. Original: ${err.message}`
      );
    }
    // Confirm the dialog dismisses so the underlying new-trip page is interactable for the next action.
    await dialog.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  /**
   * Returns true if the Financial Reference section is present on the page (in the open popup).
   * A count of zero means it is not displayed — used to assert the field is hidden for users not
   * assigned to the financial-reference group.
   *
   * @returns {Promise<boolean>}
   */
  async isFinancialReferenceSectionPresent() {
    return (await this.page.locator(SELECTORS.FINANCIAL_REFERENCE_SECTION).count()) > 0;
  }

  /**
   * Returns true if a traveler name is visible inside the reference popup's traveller section.
   * Matching uses Playwright's whitespace-normalizing text match, so a name entered with extra
   * spaces still matches its capitalized display form.
   *
   * @param {string} name - Traveler full name (e.g. "Ofira Refer")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isTravelerNameVisible(name, { timeout = 15000 } = {}) {
    if (!name || typeof name !== 'string') {
      throw new Error(`name must be a non-empty string, got: ${typeof name}`);
    }
    const normalized = name.replace(/\s+/g, ' ').trim();
    const node = this.page
      .locator(SELECTORS.TRAVELER_FIELD_SECTION)
      .getByText(normalized, { exact: false })
      .first();
    try {
      await node.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Counts how many per-traveller question blocks at checkout show a dynamic profile field with the
   * given label. Each traveller renders exactly one `section.traveler-questions` (traveler-reference-field.vue),
   * and a field label appears at most once inside it, so the count of blocks containing that label
   * equals the number of travellers the field is displayed for. Returns immediately (no wait) so the
   * caller can poll while the traveller sections finish rendering after "Booking details".
   *
   * @param {string} fieldName - The dynamic profile field label (e.g. "DYNA PROF TST")
   * @returns {Promise<number>} Number of traveller question blocks showing the field
   */
  async countTravelerSectionsShowingDynamicField(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.countTravelerSectionsShowingDynamicField] "fieldName" must be a ` +
        `non-empty string, got: ${typeof fieldName} (${fieldName})`
      );
    }
    // Case-insensitive substring match: the label concatenates a "*" mandatory marker and "info" icon
    // text around the field name, and CSS `is-capitalized` does not change the underlying text.
    const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const labelRegex = new RegExp(escaped, 'i');
    return this.page
      .locator(SELECTORS.TRAVELER_QUESTIONS)
      .filter({ has: this.page.locator(SELECTORS.FIELD_LABEL).filter({ hasText: labelRegex }) })
      .count();
  }

  /**
   * Reads the general reference-field question labels shown in the request-assistance reference-fields
   * popup, in DOM (admin-configured) order. The general-reference-field component renders the
   * `.general-questions` section with one `<article>` per configured field (v-for over generalQuestions),
   * so article order IS the admin-configured order. Every field type (textbox/checkbox/dropdown/
   * autocomplete/textarea) renders exactly one `label.label` per article, so one label per article is
   * read reliably. Scopes to VISIBLE labels to skip the hidden responsive duplicate the reference-fields
   * layout renders. Each label's leading "*" mandatory marker and trailing "info" tooltip-icon text are
   * stripped so the returned labels are the clean question texts.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string[]>} Clean field labels in display order
   */
  async getGeneralReferenceFieldLabelsInOrder({ timeout = 30000 } = {}) {
    const labels = this.page.locator(SELECTORS.GENERAL_QUESTIONS_LABEL).filter({ visible: true });
    await labels.first().waitFor({ state: 'visible', timeout });
    const rawTexts = await labels.allInnerTexts();
    return rawTexts.map((t) => cleanReferenceLabelText(t)).filter((t) => t.length > 0);
  }

  /**
   * Opens the first VISIBLE reference-field dropdown (a `.input-dropdown` container holding an
   * `.el-select`) and types filterText into it to narrow the option list. The el-select is filterable
   * (input-dropdown.vue sets `filterable`), so typing shows only options whose label matches — the
   * behaviour the "dropdown is filterable by typing" test exercises. Leaves the dropdown OPEN so the
   * following assert/select steps can act on the filtered list.
   *
   * Scenarios that use this drive a single reference-field dropdown ("THE reference field dropdown"
   * — no field name in the step), so the first visible dropdown container is the field under test.
   *
   * @param {string} filterText - Text to type to filter the dropdown options (e.g. "dulux")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<void>}
   */
  async filterReferenceFieldDropdown(filterText, { timeout = 15000 } = {}) {
    if (!filterText || typeof filterText !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.filterReferenceFieldDropdown] "filterText" must be a non-empty string, got: ${typeof filterText} (${filterText})`
      );
    }
    const container = this.page
      .locator(SELECTORS.FIELD_DROPDOWN_CONTAINER)
      .filter({ has: this.page.locator(SELECTORS.EL_SELECT), visible: true })
      .first();
    try {
      await container.waitFor({ state: 'visible', timeout });
      await container.scrollIntoViewIfNeeded();
      await container.locator(SELECTORS.EL_SELECT).first().click({ timeout: 5000 });
      // Element Plus focuses the filter input when a filterable el-select opens, so keyboard input
      // types into it and narrows the list — mirrors selectReferenceFieldDropdownOnly's filter flow.
      await this.page.keyboard.type(filterText, { delay: 30 });
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.filterReferenceFieldDropdown] Could not open a reference-field dropdown ` +
        `(selector: ${SELECTORS.FIELD_DROPDOWN_CONTAINER}) and type "${filterText}" to filter it. No visible ` +
        `filterable dropdown was found, or it did not open. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns a locator for an option in the currently OPEN el-select dropdown panel whose text matches
   * optionText (case-insensitive, partial). Scoped to the visible panel so a hidden option panel from
   * another el-select on the page is not matched.
   *
   * @param {string} optionText - Option label to match (e.g. "DULUX 6102030120")
   * @returns {import('playwright').Locator}
   */
  getOpenDropdownOption(optionText) {
    const escaped = optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionRegex = new RegExp(escaped, 'i');
    return this.page
      .locator(SELECTORS.OPEN_DROPDOWN_PANEL)
      .first()
      .locator(SELECTORS.DROPDOWN_ITEM)
      .filter({ hasText: optionRegex })
      .first();
  }

  /**
   * Returns true if an option matching optionText becomes visible in the open dropdown panel within
   * the timeout (i.e. the filter narrowed the list to the expected option).
   *
   * @param {string} optionText - Option label to look for
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isDropdownOptionVisible(optionText, { timeout = 10000 } = {}) {
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.isDropdownOptionVisible] "optionText" must be a non-empty string, got: ${typeof optionText} (${optionText})`
      );
    }
    try {
      await this.getOpenDropdownOption(optionText).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the option matching optionText in the open dropdown panel and waits for the panel to close
   * (selection committed) before returning, so the next interaction is not raced by the closing popper.
   *
   * @param {string} optionText - Option label to select
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<void>}
   */
  async selectOpenDropdownOption(optionText, { timeout = 10000 } = {}) {
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.selectOpenDropdownOption] "optionText" must be a non-empty string, got: ${typeof optionText} (${optionText})`
      );
    }
    const option = this.getOpenDropdownOption(optionText);
    try {
      await option.waitFor({ state: 'visible', timeout });
      await option.click({ timeout: 5000 });
      await this.page
        .locator(SELECTORS.OPEN_DROPDOWN_PANEL)
        .first()
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => {});
    } catch (err) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.selectOpenDropdownOption] Could not select option "${optionText}" from the ` +
        `open dropdown panel (${SELECTORS.OPEN_DROPDOWN_PANEL} ${SELECTORS.DROPDOWN_ITEM}). It was not visible ` +
        `within ${timeout}ms — the dropdown may not be open or the option label differs. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns true if the Travellers Reference Questions section header shows the given title. The
   * section (traveler-reference-field.vue) renders `.traveler-section` with an outer el-collapse whose
   * header title is $t('referenceField.travellerRefQuests') === "Travellers Reference Questions"; the
   * nested passenger headers carry traveller names, so filtering the header by the title text uniquely
   * matches the section header (a passenger name never equals the section title).
   *
   * @param {string} title - The expected section title (e.g. "Travellers Reference Questions")
   * @param {object} [options]
   * @param {number} [options.timeout=20000]
   * @returns {Promise<boolean>}
   */
  async isReferenceSectionTitleDisplayed(title, { timeout = 20000 } = {}) {
    if (!title || typeof title !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.isReferenceSectionTitleDisplayed] "title" must be a non-empty string, got: ${typeof title} (${title})`
      );
    }
    const header = this.page
      .locator(SELECTORS.TRAVELER_FIELD_SECTION)
      .locator(SELECTORS.COLLAPSE_SECTION_HEADER)
      .filter({ hasText: title })
      .first();
    try {
      await header.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks, for the passenger whose collapse header matches travellerName, whether each of the given
   * field labels renders inside that traveller's `.traveler-questions` block. Scopes to the one
   * passenger `.el-collapse-item` (resolved via its own header, so the outer "Travellers Reference
   * Questions" item — whose title never matches a name — is never picked). Uses `attached` (not
   * `visible`) so a passenger section collapsed by the accordion still resolves its labels, mirroring
   * the original Testim textContent check.
   *
   * @param {string} travellerName - Traveller full name as shown in the passenger header (e.g. "Gadi Cohen")
   * @param {string[]} labels - Field labels to look for (e.g. ["Payment Group", "Bank account"])
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<Array<{label: string, present: boolean}>>}
   */
  async travellerSectionFieldLabelPresence(travellerName, labels, { timeout = 15000 } = {}) {
    if (!travellerName || typeof travellerName !== 'string') {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.travellerSectionFieldLabelPresence] "travellerName" must be a non-empty string, got: ${typeof travellerName} (${travellerName})`
      );
    }
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error('[DynamicAndReferenceFieldsPage.travellerSectionFieldLabelPresence] "labels" must be a non-empty array.');
    }

    const nameRegex = nameContainsRegex(travellerName);
    const header = this.page
      .locator(SELECTORS.TRAVELER_FIELD_SECTION)
      .locator(SELECTORS.COLLAPSE_SECTION_HEADER)
      .filter({ hasText: nameRegex })
      .first();
    // Wait for the passenger header to render before scoping to its collapse item.
    await header.waitFor({ state: 'attached', timeout });
    // The header's parent is the passenger's `.el-collapse-item`; its `.traveler-questions` content
    // holds this traveller's field labels only. ('..' is auto-detected as xpath by Playwright.)
    const item = header.locator('..');

    const results = [];
    for (const label of labels) {
      const labelRegex = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const labelLoc = item
        .locator(SELECTORS.TRAVELER_QUESTIONS_BLOCK)
        .locator(SELECTORS.FIELD_LABEL)
        .filter({ hasText: labelRegex })
        .first();
      let present;
      try {
        await labelLoc.waitFor({ state: 'attached', timeout: 10000 });
        present = true;
      } catch {
        present = false;
      }
      results.push({ label, present });
    }
    return results;
  }

  /**
   * Reads every value shown in the Travellers Reference Questions section at checkout: the selected
   * text of each dropdown field (e.g. "Payment Group" → "ACC") and the entered value of each free-text
   * field (e.g. "Bank account" → "456"). Scoped to VISIBLE controls so hidden responsive duplicates
   * are not double-counted. Empty values are dropped.
   *
   * @returns {Promise<string[]>} Trimmed, non-empty field values in DOM order (dropdowns then textboxes)
   */
  async getAllTravellerReferenceFieldValues() {
    const section = this.page.locator(SELECTORS.TRAVELER_FIELD_SECTION);
    const values = [];

    const dropdowns = section.locator(`${SELECTORS.INPUT_DROPDOWN} ${SELECTORS.EL_SELECT}`).filter({ visible: true });
    const dropdownCount = await dropdowns.count();
    for (let i = 0; i < dropdownCount; i++) {
      const text = (await dropdowns.nth(i).innerText().catch(() => '')).trim();
      if (text) values.push(text);
    }

    const inputs = section.locator(`${SELECTORS.INPUT_TEXTBOX} input`).filter({ visible: true });
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const value = (await inputs.nth(i).inputValue().catch(() => '')).trim();
      if (value) values.push(value);
    }

    return values;
  }

  /**
   * Fills the editable free-text (`.input-textbox`) reference fields in the Travellers Reference
   * Questions section with the given values, in DOM order (e.g. the two "Bank account" fields, one per
   * traveller). Uses fill() so any existing value is replaced with exactly the new value, then blurs to
   * commit and trigger validation. Scoped to VISIBLE inputs so hidden responsive duplicates are skipped.
   *
   * @param {string[]} values - New values to enter, one per textbox in DOM order
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<void>}
   */
  async fillTravellerReferenceTextboxes(values, { timeout = 15000 } = {}) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('[DynamicAndReferenceFieldsPage.fillTravellerReferenceTextboxes] "values" must be a non-empty array.');
    }
    const inputs = this.page
      .locator(`${SELECTORS.TRAVELER_FIELD_SECTION} ${SELECTORS.INPUT_TEXTBOX} input`)
      .filter({ visible: true });
    await inputs.first().waitFor({ state: 'visible', timeout });

    const count = await inputs.count();
    if (count < values.length) {
      throw new Error(
        `[DynamicAndReferenceFieldsPage.fillTravellerReferenceTextboxes] Expected at least ${values.length} editable ` +
        `textbox reference field(s) in the Travellers Reference Questions section, but found ${count}. The traveller ` +
        `sections may not have rendered, or these fields are not free-text/editable for this configuration.`
      );
    }

    for (let i = 0; i < values.length; i++) {
      const input = inputs.nth(i);
      await input.scrollIntoViewIfNeeded();
      await input.fill(String(values[i]));
      // Blur so the field commits its value and runs validation, mirroring a real user tabbing out.
      await input.blur().catch(() => {});
    }
  }

  /**
   * Reads the current values of the editable free-text (`.input-textbox`) reference fields in the
   * Travellers Reference Questions section, in DOM order. Counterpart to fillTravellerReferenceTextboxes
   * for verifying edited values persisted. Scoped to VISIBLE inputs.
   *
   * @returns {Promise<string[]>} Trimmed textbox values in DOM order
   */
  async getTravellerReferenceTextboxValues() {
    const inputs = this.page
      .locator(`${SELECTORS.TRAVELER_FIELD_SECTION} ${SELECTORS.INPUT_TEXTBOX} input`)
      .filter({ visible: true });
    const count = await inputs.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push((await inputs.nth(i).inputValue().catch(() => '')).trim());
    }
    return values;
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

/**
 * Builds a case-insensitive, whitespace-tolerant regex that matches a traveller name as a substring.
 * The reference popup capitalizes and can double-space names (e.g. the step "Gadi Cohen" renders as
 * "Gadi  Cohen"), so each run of whitespace in the name becomes `\s+` and matching is case-insensitive.
 *
 * @param {string} name - Traveller name (e.g. "Gadi Cohen")
 * @returns {RegExp}
 */
function nameContainsRegex(name) {
  const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(escaped, 'i');
}

/**
 * Cleans the raw innerText of a reference-field `label.label` for order comparison: collapses
 * newlines/whitespace, strips the leading "*" mandatory marker, and strips the trailing "info"
 * tooltip-icon text the label concatenates (see input-checkbox.vue). Returns the bare question text.
 *
 * @param {string} text - Raw label innerText (e.g. "*\nDo you need a check in bag?\ninfo")
 * @returns {string} Clean question text (e.g. "Do you need a check in bag?")
 */
function cleanReferenceLabelText(text) {
  // Mirrors exactFieldLabelRegex's marker handling: strip the leading "*" mandatory marker and the
  // trailing "info" tooltip-icon glyph the label concatenates. The DSL comparison is contains-based,
  // so this strip is cosmetic (cleaner returned labels + error messages) — a label genuinely ending
  // in the word "info" would over-strip, matching the accepted repo-wide convention for this quirk.
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*\*\s*/, '')
    .replace(/\s*info\s*$/i, '')
    .trim();
}

module.exports = DynamicAndReferenceFieldsPage;
