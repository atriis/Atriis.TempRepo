const SELECTORS = {
  // Navigation to profile
  PASSENGER_AVATAR: '.app-header .passenger-avatar',
  USER_PROFILE_LINK: '.user-profile-link',

  // Profile tabs
  FREQUENT_PROGRAMS_TAB: '#tab-frequentPrograms',
  CONTACT_INFORMATION_TAB: "[id='tab-contactInformation'] p",
  TRAVEL_PREFERENCES_TAB: "[id='tab-travelPreferences'] p",
  PERSONAL_DETAILS_TAB: "[id='tab-personalDetails'] p",

  // Contact information form
  CONTACT_INFO_FORM: '.contact-info-form-content',

  SAVE_CONTACT_INFO_BUTTON: '.contact-info-form-content button:has-text("Save")',
  BUSINESS_PHONE_INPUTS: '.contact-info-form-content .phone-inputs-container .field.app-column.is-3:nth-child(2) .phone-inputs input',
  STATE_LABEL: '.contact-info-form-content > :nth-child(6) > :nth-child(5) .label',
  STATE_VALUE: '.contact-info-form-content > :nth-child(6) > :nth-child(5) .el-select__placeholder span',

  // Travel preferences form
  TRAVEL_PREFERENCES_FORM: '.travel-preferences-form-content',
  SAVE_TRAVEL_PREFERENCES_BUTTON: '.travel-preferences-form-content button:has-text("Save")',
  SEAT_TYPE_LABEL: 'Seat type',

  // Permissions tab
  PERMISSIONS_TAB: "[id='tab-permissions'] p",
  PERMISSIONS_SECTION_TAB: '.permissions-form .tabs-container [id*="tab-travellers"] p',
  PERMISSIONS_USER_SELECT: '.travel-arranger-table .user-select',
  PERMISSIONS_ARRANGER_ROW: '.travel-arranger-table .arranger-row',
  PERMISSIONS_TRASH_ICON: '.travel-arranger-table .trash-icon',
  PERMISSIONS_NO_ARRANGERS: '.travel-arranger-table .no-arrangers',
  TRAVEL_ARRANGER_INPUT: '.travel-arranger-table .user-select input',
  TRAVEL_ARRANGER_DROPDOWN_OPTION: '.el-vl__window span',
  TRAVEL_ARRANGER_SELECTED: '.travel-arranger-table .user-select .el-select__placeholder',

  // Traveler profile from trip page
  TRAVELER_NAME_LINK: '.trip-traveler-tag .traveler-name.is-clickable',
  PERSONAL_DETAILS_FORM: '.personal-details-form-content',
  DOB_INPUT: '.personal-details-form-content .birth-date-date-picker input',
  SAVE_PERSONAL_DETAILS_BUTTON: '.personal-details-form-content button:has-text("Save")',
  BACKUP_APPROVER_LABEL: 'Backup approver',

  // Personal Details — dynamic reference fields
  DYNAMIC_FIELD_WARNING: '.reference-fields-container .form-validation-msg',
  DYNAMIC_FIELD_SELECT_VALUE: '.reference-fields-container .el-select__placeholder span',
  DYNAMIC_FIELD_LABEL: '.reference-fields-container > :nth-child(2) .label',
  DYNAMIC_FIELD_INFO_ICON: '.reference-fields-container .info-icon',
  DYNAMIC_FIELD_TOOLTIP: '.el-popper.is-light:not([aria-hidden="true"]) .help',

  // Frequent Programs form
  FREQUENT_PROGRAMS_FORM: '.frequent-programs-form',
  FREQUENT_PROGRAMS_INPUTS: '.frequent-programs-inputs',
  ADD_FREQUENT_FLYER_BUTTON: '.add-loyalty-btn',
  REMOVE_ENTRY_BUTTON: '.remove-btn-wrapper .remove-btn',
  FF_NUMBER_INPUT: '.el-input__inner',
  FF_CARRIER_DROPDOWN: '.el-select',
  SAVE_BUTTON: 'button:has-text("Save Frequent Programs")',

  // Form of Payment tab
  FORM_OF_PAYMENT_TAB: "[id='tab-formOfPayment'] p",
  FOP_SECTION: '.profile-form-of-payment',
  FOP_ADD_CARD_BUTTON: '.profile-form-of-payment .add-card-btn',
  FOP_FORM: '.profile-form-of-payment-content',
  FOP_CARD_DISPLAY_NAME_INPUT: '.profile-form-of-payment-content .field.app-column.is-2:nth-child(1) input',
  FOP_CARD_TYPE_SELECT: '.profile-form-of-payment-content .credit-type-select',
  FOP_CARD_HOLDER_INPUT: '.profile-form-of-payment-content .field.app-column.is-2:nth-child(3) input',
  FOP_INSERT_CARD_NUMBER_BUTTON: '.profile-form-of-payment-content .insert-card-btn',
  FOP_CARD_NUMBER_MODAL_INPUT: '.payment-modal .insert-card input',
  FOP_CARD_NUMBER_MODAL_SAVE: '.payment-modal button:has-text("Save")',
  FOP_EXPIRY_MONTH_SELECT: '.profile-form-of-payment-content .expiration-inputs .app-column:nth-child(1) .el-select',
  FOP_EXPIRY_YEAR_SELECT: '.profile-form-of-payment-content .expiration-inputs .app-column:nth-child(2) .el-select',
  FOP_ADDRESS_INPUT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(1) input',
  FOP_CITY_INPUT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(2) input',
  FOP_ZIP_INPUT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(3) input',
  FOP_COUNTRY_SELECT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(4) .el-select',
  FOP_STATE_SELECT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column:nth-child(5) .el-select',
  FOP_SAVE_BUTTON: '.profile-form-of-payment-content button:has-text("Save")',
  FOP_CARD_PREVIEW: '.profile-form-of-payment .card-preview',
  FOP_CARD_HOLDER_NAME_DISPLAY: '.profile-form-of-payment .card-holder-name',
  FOP_CARD_ACTIONS_DROPDOWN: '.profile-form-of-payment .card-preview .actions-dropdown .expand-icon',
  FOP_DELETE_CARD_OPTION: '.share-popper .el-dropdown-menu__item:last-child p',

  // Passports & Visas tab
  PASSPORTS_VISAS_TAB: "[id='tab-passportsAndVisas'] p",
  PASSPORT_VISA_FORM: '.passport-visa-form',
  PASSPORT_INPUTS: '.passport-inputs',
  VISA_INPUTS_CONTAINER: '.visa-inputs-container',
  VISA_INPUTS: '.visa-inputs',
  VISA_COUNTRY_SELECT: '.visa-inputs .field.app-column:nth-child(1) .el-select',
  VISA_VALID_UNTIL_INPUT: '.visa-inputs .field.app-column:nth-child(2) .app-datepicker input',
  VISA_NUMBER_INPUT: '.visa-inputs .field.app-column:nth-child(3) input',
  VISA_REMOVE_BUTTON: '.visa-inputs .remove-btn-wrapper .remove-btn',
  SAVE_PASSPORTS_VISAS_BUTTON: '.passport-visa-form .btns-container button',
  KNOWN_TRAVELER_INPUT: '.additional-inputs-container .field.app-column:first-child input',
  DATE_PICKER_PANEL: '.el-picker-panel:visible',
  DATE_PICKER_NEXT_YEAR_ARROW: 'button.el-picker-panel__icon-btn.d-arrow-right:visible',

  // Confirm delete dialog
  CONFIRM_DELETE_BUTTON: 'button:has-text("Yes, Delete")',

  // Dropdown options
  DROPDOWN_OPTION: '.el-select-dropdown__item',
};

class ProfilePage {
  constructor(page) {
    this.page = page;
  }

  // --- Navigation ---

  async hoverAvatar() {
    try {
      await this.page.locator(SELECTORS.PASSENGER_AVATAR).hover({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.hoverAvatar] Could not hover over passenger avatar (selector: ${SELECTORS.PASSENGER_AVATAR}). ` +
        `The avatar may not be rendered yet or the user is not logged in. Original: ${err.message}`
      );
    }
  }

  async clickProfileLink() {
    try {
      await this.page.locator(SELECTORS.USER_PROFILE_LINK).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickProfileLink] Could not click "Profile settings" link (selector: ${SELECTORS.USER_PROFILE_LINK}). ` +
        `The tooltip with the profile link may not have appeared after hovering the avatar. Original: ${err.message}`
      );
    }
  }

  // --- Tabs ---

  async clickFrequentProgramsTab() {
    try {
      await this.page.locator(SELECTORS.FREQUENT_PROGRAMS_TAB).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickFrequentProgramsTab] Could not click Frequent Programs tab (selector: ${SELECTORS.FREQUENT_PROGRAMS_TAB}). ` +
        `The user profile page may not have loaded, or the tab is not visible. Original: ${err.message}`
      );
    }
  }

  async waitForFrequentProgramsForm() {
    try {
      await this.page.locator(SELECTORS.FREQUENT_PROGRAMS_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForFrequentProgramsForm] Frequent Programs form did not appear (selector: ${SELECTORS.FREQUENT_PROGRAMS_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  // --- FQTV Entry Management ---

  async _findEntryByFqtvNumber(fqtvNumber) {
    // el-input doesn't set HTML value attribute — scan all entry rows for the input with matching value
    const rows = this.page.locator(SELECTORS.FREQUENT_PROGRAMS_INPUTS);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const inputs = row.locator('input');
      const inputCount = await inputs.count();
      for (let j = 0; j < inputCount; j++) {
        const val = await inputs.nth(j).inputValue().catch(() => '');
        if (val === fqtvNumber) {
          return row;
        }
      }
    }
    return null;
  }

  async isFqtvEntryVisible(fqtvNumber) {
    const entry = await this._findEntryByFqtvNumber(fqtvNumber);
    return entry !== null;
  }

  async clickRemoveOnEntry(fqtvNumber) {
    try {
      const entry = await this._findEntryByFqtvNumber(fqtvNumber);
      if (!entry) {
        throw new Error(`No entry row found containing input with value "${fqtvNumber}"`);
      }
      await entry.locator(SELECTORS.REMOVE_ENTRY_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickRemoveOnEntry] Could not click remove button on FQTV entry "${fqtvNumber}". ` +
        `The entry may not exist or the delete icon is not visible. Original: ${err.message}`
      );
    }
  }

  async confirmDeleteDialog() {
    try {
      await this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON).waitFor({ state: 'visible', timeout: 10000 });
      await this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmDeleteDialog] Could not confirm the delete dialog. ` +
        `The dialog may not have appeared or the "Yes, Delete" button is not clickable. Original: ${err.message}`
      );
    }
  }

  async waitForEntryToDisappear(fqtvNumber) {
    try {
      // Poll until the entry is no longer found (max 15s)
      const startTime = Date.now();
      const timeout = 15000;
      while (Date.now() - startTime < timeout) {
        const entry = await this._findEntryByFqtvNumber(fqtvNumber);
        if (!entry) return;
        await this.page.waitForTimeout(500);
      }
      throw new Error(`Entry still present after ${timeout}ms`);
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForEntryToDisappear] FQTV entry "${fqtvNumber}" is still visible after deletion. ` +
        `The remove operation may not have completed. Original: ${err.message}`
      );
    }
  }

  // --- Add FQTV ---

  async clickAddFrequentFlyer() {
    try {
      await this.page.locator(SELECTORS.ADD_FREQUENT_FLYER_BUTTON).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickAddFrequentFlyer] Could not click "Add Frequent Flyer" button (selector: ${SELECTORS.ADD_FREQUENT_FLYER_BUTTON}). ` +
        `The Frequent Programs form may not be loaded. Original: ${err.message}`
      );
    }
  }

  async selectFirstAirlineFromDropdown() {
    try {
      const lastInputGroup = this.page.locator(SELECTORS.FREQUENT_PROGRAMS_INPUTS).last();
      await lastInputGroup.locator(SELECTORS.FF_CARRIER_DROPDOWN).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectFirstAirlineFromDropdown] Could not select the first airline from the carrier dropdown. ` +
        `The dropdown may not have opened or no options are available. Original: ${err.message}`
      );
    }
  }

  async fillFqtvNumber(fqtvNumber) {
    try {
      const lastInputGroup = this.page.locator(SELECTORS.FREQUENT_PROGRAMS_INPUTS).last();
      const numberInput = lastInputGroup.locator(SELECTORS.FF_NUMBER_INPUT);
      await numberInput.fill(fqtvNumber, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillFqtvNumber] Could not fill FQTV number "${fqtvNumber}" into the input field. ` +
        `The input may not be visible or editable. Original: ${err.message}`
      );
    }
  }

  async clickSaveFrequentPrograms() {
    try {
      await this.page.locator(SELECTORS.SAVE_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveFrequentPrograms] Could not click the Save button (selector: ${SELECTORS.SAVE_BUTTON}). ` +
        `The form may not be in a valid state or the button is disabled. Original: ${err.message}`
      );
    }
  }

  async getAllLoyaltyInputValues() {
    try {
      // Loyalty entries span 3 sections (flights, hotel, car/rail), each using different row classes.
      // Querying all el-input fields within the form covers every section in one pass.
      const inputs = this.page.locator(`${SELECTORS.FREQUENT_PROGRAMS_FORM} ${SELECTORS.FF_NUMBER_INPUT}`);
      const count = await inputs.count();
      const values = [];
      for (let i = 0; i < count; i++) {
        const val = await inputs.nth(i).inputValue().catch(() => '');
        if (val) values.push(val);
      }
      return values;
    } catch (err) {
      throw new Error(
        `[ProfilePage.getAllLoyaltyInputValues] Could not collect loyalty number input values ` +
        `(selector: ${SELECTORS.FREQUENT_PROGRAMS_FORM} ${SELECTORS.FF_NUMBER_INPUT}). ` +
        `Ensure the Frequent Programs tab is open. Original: ${err.message}`
      );
    }
  }

  // --- Personal Details — Dynamic Reference Fields ---

  async getDynamicFieldWarningCount() {
    try {
      return await this.page.locator(SELECTORS.DYNAMIC_FIELD_WARNING).count();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDynamicFieldWarningCount] Failed to count dynamic field warning messages ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_WARNING}). Original: ${err.message}`
      );
    }
  }

  async getDynamicFieldSelectValue() {
    try {
      const locator = this.page.locator(SELECTORS.DYNAMIC_FIELD_SELECT_VALUE).first();
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      return await locator.textContent();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDynamicFieldSelectValue] Failed to read the selected value from the dynamic field dropdown ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_SELECT_VALUE}). ` +
        `The field may not be rendered or the reference-fields-container is missing. Original: ${err.message}`
      );
    }
  }

  async clickPersonalDetailsTab() {
    try {
      const tab = this.page.locator(SELECTORS.PERSONAL_DETAILS_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPersonalDetailsTab] Could not click Personal Details tab ` +
        `(selector: ${SELECTORS.PERSONAL_DETAILS_TAB}). The profile page may not have loaded or the tab is not rendered. ` +
        `Original: ${err.message}`
      );
    }
  }

  async scrollToDynamicFieldLabel() {
    try {
      const label = this.page.locator(SELECTORS.DYNAMIC_FIELD_LABEL).first();
      await label.waitFor({ state: 'visible', timeout: 10000 });
      await label.scrollIntoViewIfNeeded();
    } catch (err) {
      throw new Error(
        `[ProfilePage.scrollToDynamicFieldLabel] Could not scroll to the dynamic reference field label ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_LABEL}). The reference-fields-container may not be present on this profile. ` +
        `Original: ${err.message}`
      );
    }
  }

  async hoverDynamicFieldInfoIcon() {
    try {
      const icon = this.page.locator(SELECTORS.DYNAMIC_FIELD_INFO_ICON).first();
      await icon.waitFor({ state: 'visible', timeout: 10000 });
      await icon.hover();
    } catch (err) {
      throw new Error(
        `[ProfilePage.hoverDynamicFieldInfoIcon] Could not hover over the dynamic field info icon ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_INFO_ICON}). The icon may not exist for this field or the field is not in view. ` +
        `Original: ${err.message}`
      );
    }
  }

  async getDynamicFieldTooltipText() {
    try {
      const tooltip = this.page.locator(SELECTORS.DYNAMIC_FIELD_TOOLTIP).first();
      await tooltip.waitFor({ state: 'attached', timeout: 10000 });
      return await tooltip.textContent();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDynamicFieldTooltipText] Could not read tooltip text ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_TOOLTIP}). The tooltip may not have appeared after hover — ` +
        `ensure the info icon was hovered and the helpQuestionText is populated for this field. ` +
        `Original: ${err.message}`
      );
    }
  }

  // --- Travel Preferences Tab ---

  async clickTravelPreferencesTab() {
    try {
      const tab = this.page.locator(SELECTORS.TRAVEL_PREFERENCES_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickTravelPreferencesTab] Could not click Travel Preferences tab (selector: ${SELECTORS.TRAVEL_PREFERENCES_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden behind overflow. Original: ${err.message}`
      );
    }
  }

  async waitForTravelPreferencesForm() {
    try {
      await this.page.locator(SELECTORS.TRAVEL_PREFERENCES_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForTravelPreferencesForm] Travel Preferences form did not appear (selector: ${SELECTORS.TRAVEL_PREFERENCES_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  async clickSeatPreferenceDropdown() {
    try {
      const seatField = this.page.locator(SELECTORS.TRAVEL_PREFERENCES_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.SEAT_TYPE_LABEL}")`) });
      const select = seatField.locator('.el-select');
      await select.waitFor({ state: 'visible', timeout: 10000 });
      await select.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSeatPreferenceDropdown] Could not click the Seat type dropdown (label: "${SELECTORS.SEAT_TYPE_LABEL}"). ` +
        `The travel preferences form may not be loaded or the field is disabled. Original: ${err.message}`
      );
    }
  }

  async selectSeatPreferenceOption(optionText) {
    try {
      const option = this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: optionText });
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectSeatPreferenceOption] Could not select seat preference option "${optionText}" from dropdown. ` +
        `The dropdown may not have opened or the option does not exist. Original: ${err.message}`
      );
    }
  }

  async getSeatPreferenceText() {
    try {
      const seatField = this.page.locator(SELECTORS.TRAVEL_PREFERENCES_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.SEAT_TYPE_LABEL}")`) });
      const placeholder = seatField.locator('.el-select__placeholder span');
      await placeholder.waitFor({ state: 'attached', timeout: 10000 });
      const text = await placeholder.textContent();
      return text ? text.trim() : '';
    } catch (err) {
      throw new Error(
        `[ProfilePage.getSeatPreferenceText] Could not read seat preference value (label: "${SELECTORS.SEAT_TYPE_LABEL}"). ` +
        `The travel preferences form may not be loaded. Original: ${err.message}`
      );
    }
  }

  async clickSaveTravelPreferences() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_TRAVEL_PREFERENCES_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveTravelPreferences] Could not click the Save Travel Preferences button (selector: ${SELECTORS.SAVE_TRAVEL_PREFERENCES_BUTTON}). ` +
        `The button may be hidden, disabled, or the form did not load. Original: ${err.message}`
      );
    }
  }

  // --- Contact Information Tab ---

  async clickContactInformationTab() {
    try {
      const tab = this.page.locator(SELECTORS.CONTACT_INFORMATION_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickContactInformationTab] Could not click Contact Information tab (selector: ${SELECTORS.CONTACT_INFORMATION_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden behind overflow. Original: ${err.message}`
      );
    }
  }

  async waitForContactInfoForm() {
    try {
      await this.page.locator(SELECTORS.CONTACT_INFO_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForContactInfoForm] Contact Information form did not appear (selector: ${SELECTORS.CONTACT_INFO_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  async getCityInputValue() {
    try {
      // Locate the Business address city field by finding the .field container
      // with a label containing "City" text under the Business address section
      const cityField = this.page.locator(SELECTORS.CONTACT_INFO_FORM)
        .locator('.field.app-column', { has: this.page.locator('label', { hasText: 'City' }) })
        .first()
        .locator('input');
      await cityField.waitFor({ state: 'visible', timeout: 10000 });
      return await cityField.inputValue();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getCityInputValue] Could not read city input value. ` +
        `The contact information form may not be loaded or the city field is not visible. Original: ${err.message}`
      );
    }
  }

  async clickSaveContactInfo() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_CONTACT_INFO_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveContactInfo] Could not click the Save Contact Information button (selector: ${SELECTORS.SAVE_CONTACT_INFO_BUTTON}). ` +
        `The button may be hidden, disabled, or the form did not load. Original: ${err.message}`
      );
    }
  }

  async getBusinessPhoneValues() {
    try {
      const inputs = this.page.locator(SELECTORS.BUSINESS_PHONE_INPUTS);
      await inputs.first().waitFor({ state: 'visible', timeout: 10000 });
      const countryCode = await inputs.nth(0).inputValue();
      const areaCode = await inputs.nth(1).inputValue();
      const number = await inputs.nth(2).inputValue();
      return { countryCode, areaCode, number };
    } catch (err) {
      throw new Error(
        `[ProfilePage.getBusinessPhoneValues] Could not read business phone input values (selector: ${SELECTORS.BUSINESS_PHONE_INPUTS}). ` +
        `The Contact Information form may not be loaded or phone fields are not rendered. Original: ${err.message}`
      );
    }
  }

  async getStateFieldValue() {
    try {
      await this.page.locator(SELECTORS.STATE_LABEL).waitFor({ state: 'visible', timeout: 10000 });
      const value = await this.page.locator(SELECTORS.STATE_VALUE).textContent();
      return value ? value.trim() : '';
    } catch (err) {
      throw new Error(
        `[ProfilePage.getStateFieldValue] Could not read state field value (label: ${SELECTORS.STATE_LABEL}, value: ${SELECTORS.STATE_VALUE}). ` +
        `The "State" dropdown may not be visible — this field only appears for countries that have states. Original: ${err.message}`
      );
    }
  }

  // --- Permissions Tab ---

  async clickPermissionsTab() {
    try {
      const tab = this.page.locator(SELECTORS.PERMISSIONS_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPermissionsTab] Could not click Permissions tab (selector: ${SELECTORS.PERMISSIONS_TAB}). ` +
        `The tab may not be visible — it only appears for users with the CanUseTravelArrangerAssignment permission. Original: ${err.message}`
      );
    }
  }

  async clickPermissionsSection(sectionName) {
    try {
      const section = this.page.locator(SELECTORS.PERMISSIONS_SECTION_TAB);
      await section.waitFor({ state: 'attached', timeout: 15000 });
      await section.dispatchEvent('click');
      // Wait for the section content to render after tab switch
      await this.page.locator(SELECTORS.PERMISSIONS_USER_SELECT).waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPermissionsSection] Could not click section "${sectionName}" (selector: ${SELECTORS.PERMISSIONS_SECTION_TAB}). ` +
        `The inner tab may be hidden behind CSS overflow or the content failed to load. Original: ${err.message}`
      );
    }
  }

  async clickTrashIconOnFirstArranger() {
    try {
      const trashIcon = this.page.locator(SELECTORS.PERMISSIONS_TRASH_ICON).first();
      await trashIcon.waitFor({ state: 'visible', timeout: 10000 });
      await trashIcon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickTrashIconOnFirstArranger] Could not click trash icon on first arranger row (selector: ${SELECTORS.PERMISSIONS_TRASH_ICON}). ` +
        `There may be no users in the table or the trash icon is not rendered. Original: ${err.message}`
      );
    }
  }

  async confirmRemoveUser() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmRemoveUser] Could not click confirm button in remove dialog (selector: ${SELECTORS.CONFIRM_DELETE_BUTTON}). ` +
        `The confirm dialog may not have appeared. Original: ${err.message}`
      );
    }
  }

  async isArrangerTableEmpty() {
    const noArrangers = this.page.locator(SELECTORS.PERMISSIONS_NO_ARRANGERS);
    const rows = this.page.locator(SELECTORS.PERMISSIONS_ARRANGER_ROW);
    const noArrangersVisible = await noArrangers.isVisible().catch(() => false);
    if (noArrangersVisible) return true;
    const rowCount = await rows.count();
    return rowCount === 0;
  }

  async fillTravelArrangerSearch(name) {
    try {
      const select = this.page.locator(SELECTORS.PERMISSIONS_USER_SELECT);
      await select.click({ timeout: 10000 });
      const input = this.page.locator(SELECTORS.TRAVEL_ARRANGER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.fill(name, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillTravelArrangerSearch] Could not fill travel arranger search with "${name}" (selector: ${SELECTORS.TRAVEL_ARRANGER_INPUT}). ` +
        `The select may not have opened or input is not visible. Original: ${err.message}`
      );
    }
  }

  async selectTravelArrangerFromDropdown() {
    try {
      const option = this.page.locator(SELECTORS.TRAVEL_ARRANGER_DROPDOWN_OPTION);
      await option.first().waitFor({ state: 'visible', timeout: 10000 });
      await option.first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectTravelArrangerFromDropdown] Could not select option from travel arranger dropdown (selector: ${SELECTORS.TRAVEL_ARRANGER_DROPDOWN_OPTION}). ` +
        `No results may have appeared for the search query. Original: ${err.message}`
      );
    }
  }

  async getTravelArrangerSelectedText() {
    try {
      const selected = this.page.locator(SELECTORS.TRAVEL_ARRANGER_SELECTED);
      await selected.waitFor({ state: 'visible', timeout: 10000 });
      const text = await selected.textContent();
      return text ? text.trim() : '';
    } catch (err) {
      throw new Error(
        `[ProfilePage.getTravelArrangerSelectedText] Could not read selected travel arranger text (selector: ${SELECTORS.TRAVEL_ARRANGER_SELECTED}). ` +
        `No travel arranger may have been selected yet. Original: ${err.message}`
      );
    }
  }

  // --- Traveler Profile (from trip page) ---

  async clickTravelerNameLink(travelerName) {
    try {
      const link = this.page.locator(SELECTORS.TRAVELER_NAME_LINK).filter({ hasText: travelerName });
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickTravelerNameLink] Could not click traveler name link "${travelerName}" (selector: ${SELECTORS.TRAVELER_NAME_LINK}). ` +
        `The traveler may not have been added to the trip or the name didn't load. Original: ${err.message}`
      );
    }
  }

  async clickFirstTravelerNameLink() {
    try {
      const link = this.page.locator(SELECTORS.TRAVELER_NAME_LINK).first();
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickFirstTravelerNameLink] Could not click first traveler name link (selector: ${SELECTORS.TRAVELER_NAME_LINK}). ` +
        `No traveler may have been added to the trip. Original: ${err.message}`
      );
    }
  }

  async waitForPersonalDetailsForm() {
    try {
      await this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForPersonalDetailsForm] Personal details form did not appear (selector: ${SELECTORS.PERSONAL_DETAILS_FORM}). ` +
        `The traveler profile may not have opened or is still loading. Original: ${err.message}`
      );
    }
  }

  async clickSavePersonalDetails() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_PERSONAL_DETAILS_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSavePersonalDetails] Could not click the Save Personal Details button (selector: ${SELECTORS.SAVE_PERSONAL_DETAILS_BUTTON}). ` +
        `The button may be hidden, disabled, or the form did not load. Original: ${err.message}`
      );
    }
  }

  async clickBackupApproverDropdown() {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const select = field.locator('.el-select');
      await select.waitFor({ state: 'visible', timeout: 10000 });
      await select.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickBackupApproverDropdown] Could not click the backup approver dropdown. ` +
        `The personal details form may not be loaded or the field is disabled. Original: ${err.message}`
      );
    }
  }

  async fillBackupApproverSearch(term) {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const input = field.locator('.el-select input');
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill(term, { timeout: 5000 });
      // Wait for virtualized dropdown results to appear
      await this.page.waitForTimeout(1000);
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBackupApproverSearch] Could not type "${term}" into the backup approver search input. ` +
        `The dropdown may not be open or the input is not visible. Original: ${err.message}`
      );
    }
  }

  async selectFirstDropdownOption() {
    try {
      const option = this.page.locator('.el-vl__window span').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectFirstDropdownOption] Could not select the first dropdown option. ` +
        `No options appeared — the search may have returned no results. Original: ${err.message}`
      );
    }
  }

  async getBackupApproverText() {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const placeholder = field.locator('.el-select .el-select__placeholder span');
      await placeholder.waitFor({ state: 'visible', timeout: 10000 });
      return await placeholder.textContent();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getBackupApproverText] Could not read backup approver field text. ` +
        `The field may not be visible or the form didn't load. Original: ${err.message}`
      );
    }
  }

  async clearBackupApprover() {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const select = field.locator('.el-select');
      await select.hover({ timeout: 10000 });
      await this.page.waitForTimeout(500);
      // In Element Plus el-select-v2, the clear icon is a circle-close SVG that appears on hover
      const clearIcon = select.locator('.el-select__suffix .el-icon:visible').first();
      await clearIcon.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clearBackupApprover] Could not clear the backup approver selection. ` +
        `The clear icon may not be visible — ensure a value is selected and the field is not disabled. Original: ${err.message}`
      );
    }
  }

  async getDobInputValue() {
    try {
      const input = this.page.locator(SELECTORS.DOB_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      return await input.inputValue();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDobInputValue] Could not read DOB input value (selector: ${SELECTORS.DOB_INPUT}). ` +
        `The personal details form may not be loaded. Original: ${err.message}`
      );
    }
  }

  // Directly types a date string into the DOB input (format: 'DD MMM YYYY', e.g. '15 Jan 1990').
  // Clicks first to trigger resetFieldValueIfMasked, then fills and confirms with Tab.
  async typeDobValue(dateString) {
    try {
      const input = this.page.locator(SELECTORS.DOB_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.click({ timeout: 10000 });
      await input.fill(dateString);
      await input.press('Tab');
    } catch (err) {
      throw new Error(
        `[ProfilePage.typeDobValue] Could not type DOB value "${dateString}" into input (selector: ${SELECTORS.DOB_INPUT}). ` +
        `The field may be disabled or not visible. Original: ${err.message}`
      );
    }
  }


  // --- Form of Payment Tab ---

  async clickFormOfPaymentTab() {
    try {
      const tab = this.page.locator(SELECTORS.FORM_OF_PAYMENT_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickFormOfPaymentTab] Could not click Form of Payment tab (selector: ${SELECTORS.FORM_OF_PAYMENT_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden. Original: ${err.message}`
      );
    }
  }

  async waitForFopSection() {
    try {
      await this.page.locator(SELECTORS.FOP_SECTION).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForFopSection] Form of Payment section did not appear (selector: ${SELECTORS.FOP_SECTION}). ` +
        `The tab may not have switched or the section failed to load. Original: ${err.message}`
      );
    }
  }

  async clickAddNewCard() {
    try {
      await this.page.locator(SELECTORS.FOP_ADD_CARD_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickAddNewCard] Could not click "Add New Card" button (selector: ${SELECTORS.FOP_ADD_CARD_BUTTON}). ` +
        `The FOP section may not be loaded. Original: ${err.message}`
      );
    }
  }

  async waitForFopForm() {
    try {
      await this.page.locator(SELECTORS.FOP_FORM).waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForFopForm] Card form did not appear (selector: ${SELECTORS.FOP_FORM}). ` +
        `The "Add New Card" button may not have been clicked. Original: ${err.message}`
      );
    }
  }

  async fillCardDisplayName(name) {
    try {
      await this.page.locator(SELECTORS.FOP_CARD_DISPLAY_NAME_INPUT).fill(name, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillCardDisplayName] Could not fill card display name "${name}" (selector: ${SELECTORS.FOP_CARD_DISPLAY_NAME_INPUT}). ` +
        `Original: ${err.message}`
      );
    }
  }

  async selectCardType(typeName) {
    try {
      await this.page.locator(SELECTORS.FOP_CARD_TYPE_SELECT).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: typeName }).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectCardType] Could not select card type "${typeName}" from dropdown. ` +
        `The dropdown may not have opened or the option doesn't exist. Original: ${err.message}`
      );
    }
  }

  async fillCardHolderName(name) {
    try {
      await this.page.locator(SELECTORS.FOP_CARD_HOLDER_INPUT).fill(name, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillCardHolderName] Could not fill card holder name "${name}" (selector: ${SELECTORS.FOP_CARD_HOLDER_INPUT}). ` +
        `Original: ${err.message}`
      );
    }
  }

  async insertCardNumber(cardNumber) {
    try {
      await this.page.locator(SELECTORS.FOP_INSERT_CARD_NUMBER_BUTTON).click({ timeout: 10000 });
      const modalInput = this.page.locator(SELECTORS.FOP_CARD_NUMBER_MODAL_INPUT);
      await modalInput.waitFor({ state: 'visible', timeout: 10000 });
      await modalInput.fill(cardNumber, { timeout: 10000 });
      await this.page.locator(SELECTORS.FOP_CARD_NUMBER_MODAL_SAVE).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.insertCardNumber] Could not insert card number into modal. ` +
        `The modal may not have opened or the save button failed. Original: ${err.message}`
      );
    }
  }

  async selectExpiryMonth(month) {
    try {
      await this.page.locator(SELECTORS.FOP_EXPIRY_MONTH_SELECT).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: month }).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectExpiryMonth] Could not select expiry month "${month}". Original: ${err.message}`
      );
    }
  }

  async selectExpiryYear(year) {
    try {
      await this.page.locator(SELECTORS.FOP_EXPIRY_YEAR_SELECT).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: year }).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectExpiryYear] Could not select expiry year "${year}". Original: ${err.message}`
      );
    }
  }

  async fillBillingAddress(address) {
    try {
      await this.page.locator(SELECTORS.FOP_ADDRESS_INPUT).fill(address, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBillingAddress] Could not fill address "${address}". Original: ${err.message}`
      );
    }
  }

  async fillBillingCity(city) {
    try {
      await this.page.locator(SELECTORS.FOP_CITY_INPUT).fill(city, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBillingCity] Could not fill city "${city}". Original: ${err.message}`
      );
    }
  }

  async fillBillingZipCode(zipCode) {
    try {
      await this.page.locator(SELECTORS.FOP_ZIP_INPUT).fill(zipCode, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBillingZipCode] Could not fill zip code "${zipCode}". Original: ${err.message}`
      );
    }
  }

  async selectBillingCountry(country) {
    try {
      await this.page.locator(SELECTORS.FOP_COUNTRY_SELECT).click({ timeout: 10000 });
      await this.page.getByRole('option', { name: country }).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectBillingCountry] Could not select country "${country}". Original: ${err.message}`
      );
    }
  }

  async selectBillingState(state) {
    try {
      const stateSelect = this.page.locator(SELECTORS.FOP_STATE_SELECT);
      const isVisible = await stateSelect.isVisible().catch(() => false);
      if (!isVisible) return;
      await stateSelect.click({ timeout: 10000 });
      await this.page.getByRole('option', { name: state }).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectBillingState] Could not select state "${state}". Original: ${err.message}`
      );
    }
  }

  async clickSaveFop() {
    try {
      await this.page.locator(SELECTORS.FOP_SAVE_BUTTON).click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveFop] Could not click Save FOP button (selector: ${SELECTORS.FOP_SAVE_BUTTON}). ` +
        `The form may have validation errors or the button is not visible. Original: ${err.message}`
      );
    }
  }

  async getCardHolderNameFromPreview() {
    try {
      const cardHolder = this.page.locator(SELECTORS.FOP_CARD_HOLDER_NAME_DISPLAY).last();
      await cardHolder.waitFor({ state: 'visible', timeout: 15000 });
      return (await cardHolder.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getCardHolderNameFromPreview] Could not read card holder name from preview (selector: ${SELECTORS.FOP_CARD_HOLDER_NAME_DISPLAY}). ` +
        `No card may be listed. Original: ${err.message}`
      );
    }
  }

  async clickDeleteOnLastCard() {
    try {
      const actionBtn = this.page.locator(SELECTORS.FOP_CARD_ACTIONS_DROPDOWN).last();
      await actionBtn.click({ timeout: 10000 });
      await this.page.locator(SELECTORS.FOP_DELETE_CARD_OPTION).last().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickDeleteOnLastCard] Could not open actions menu or click delete option. ` +
        `The card may not exist or the dropdown failed to open. Original: ${err.message}`
      );
    }
  }

  async confirmRemoveFopCard() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmRemoveFopCard] Could not confirm card removal (selector: ${SELECTORS.CONFIRM_DELETE_BUTTON}). ` +
        `The confirmation dialog may not have appeared. Original: ${err.message}`
      );
    }
  }

  async getCardPreviewCount() {
    try {
      await this.page.waitForTimeout(1000);
      return await this.page.locator(SELECTORS.FOP_CARD_PREVIEW).count();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getCardPreviewCount] Could not count card previews. Original: ${err.message}`
      );
    }
  }

  // --- Passports & Visas Tab ---

  async clickPassportsVisasTab() {
    try {
      const tab = this.page.locator(SELECTORS.PASSPORTS_VISAS_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPassportsVisasTab] Could not click Passports & Visas tab (selector: ${SELECTORS.PASSPORTS_VISAS_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden. Original: ${err.message}`
      );
    }
  }

  async fillKnownTravelerNumber(value) {
    try {
      const input = this.page.locator(SELECTORS.KNOWN_TRAVELER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      // Triple-click to select any existing value, then use pressSequentially so
      // each keystroke fires the keyboard events needed for Vue v-model to update.
      await input.click({ clickCount: 3, timeout: 10000 });
      await input.pressSequentially(value, { delay: 50 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillKnownTravelerNumber] Could not fill known traveler number "${value}" (selector: ${SELECTORS.KNOWN_TRAVELER_INPUT}). ` +
        `The Passports & Visas tab may not be open or the additional-inputs section is not visible. Original: ${err.message}`
      );
    }
  }

  async getKnownTravelerNumberValue() {
    try {
      const input = this.page.locator(SELECTORS.KNOWN_TRAVELER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      return await input.inputValue();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getKnownTravelerNumberValue] Could not read known traveler number field (selector: ${SELECTORS.KNOWN_TRAVELER_INPUT}). ` +
        `The Passports & Visas tab may not be open. Original: ${err.message}`
      );
    }
  }

  async waitForPassportVisaForm() {
    try {
      await this.page.locator(SELECTORS.PASSPORT_VISA_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForPassportVisaForm] Passport & Visa form did not appear (selector: ${SELECTORS.PASSPORT_VISA_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  async ensurePassportExists() {
    const passportInputs = this.page.locator(SELECTORS.PASSPORT_INPUTS);
    const count = await passportInputs.count();
    if (count > 0) return;

    // No passport exists — click "Add new passport" to create an empty entry
    try {
      const addPassportBtn = this.page.getByText('Add new passport');
      await addPassportBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addPassportBtn.click({ timeout: 10000 });
      await this.page.locator(SELECTORS.PASSPORT_INPUTS).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.ensurePassportExists] Could not add a passport entry. ` +
        `The "Add new passport" button may not be visible. Original: ${err.message}`
      );
    }
  }

  async clickAddVisa() {
    try {
      const addVisaBtn = this.page.getByText('Add new visa').first();
      await addVisaBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addVisaBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickAddVisa] Could not click "Add new visa" button. ` +
        `A passport entry must exist first — visas are nested under a passport. Original: ${err.message}`
      );
    }
  }

  async selectVisaCountry(countryName) {
    try {
      const visaCountrySelect = this.page.locator(SELECTORS.VISA_COUNTRY_SELECT).last();
      await visaCountrySelect.click({ timeout: 10000 });
      // Filterable app-select: type to filter, then pick the visible option
      const input = visaCountrySelect.locator('input');
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill(countryName);
      const option = this.page.locator('.el-select-dropdown__item:visible').filter({ hasText: new RegExp(`^${countryName}`, 'i') }).first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectVisaCountry] Could not select visa country "${countryName}". ` +
        `The dropdown may not have opened, the input may not be filterable, or the country option doesn't exist. Original: ${err.message}`
      );
    }
  }

  async openVisaDatePicker() {
    try {
      const dateInput = this.page.locator(SELECTORS.VISA_VALID_UNTIL_INPUT).last();
      await dateInput.waitFor({ state: 'visible', timeout: 10000 });
      await dateInput.click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DATE_PICKER_PANEL).waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.openVisaDatePicker] Could not open the visa "Valid until" date picker. ` +
        `The visa row may not have been added or the input is not visible. Original: ${err.message}`
      );
    }
  }

  async clickNextYearArrow(times = 1) {
    try {
      for (let i = 0; i < times; i++) {
        const arrow = this.page.locator(SELECTORS.DATE_PICKER_NEXT_YEAR_ARROW).first();
        await arrow.waitFor({ state: 'visible', timeout: 5000 });
        await arrow.click({ timeout: 5000 });
        await this.page.waitForTimeout(300);
      }
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickNextYearArrow] Could not click next-year arrow ${times} time(s). ` +
        `The date picker panel may not be visible or the year arrows are not rendered (showYearArrows must be true). Original: ${err.message}`
      );
    }
  }

  async selectFirstAvailableDay() {
    try {
      const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL);
      const day = panel.locator('td.available .el-date-table-cell__text').first();
      await day.waitFor({ state: 'visible', timeout: 5000 });
      await day.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectFirstAvailableDay] Could not select a day from the date picker calendar. ` +
        `No available day cells were found — the calendar may not be visible. Original: ${err.message}`
      );
    }
  }

  async fillVisaNumber(number) {
    try {
      const input = this.page.locator(SELECTORS.VISA_NUMBER_INPUT).last();
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.fill(number, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillVisaNumber] Could not fill visa number "${number}" (selector: ${SELECTORS.VISA_NUMBER_INPUT}). ` +
        `The visa form row may not have been added. Original: ${err.message}`
      );
    }
  }

  async clickSavePassportsVisas() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_PASSPORTS_VISAS_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSavePassportsVisas] Could not click "Save Passports and Visas" button (selector: ${SELECTORS.SAVE_PASSPORTS_VISAS_BUTTON}). ` +
        `The form may have validation errors or the button is not visible. Original: ${err.message}`
      );
    }
  }

  async clickRemoveVisa() {
    try {
      const removeBtn = this.page.locator(SELECTORS.VISA_REMOVE_BUTTON).last();
      await removeBtn.waitFor({ state: 'visible', timeout: 10000 });
      await removeBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickRemoveVisa] Could not click remove button on visa (selector: ${SELECTORS.VISA_REMOVE_BUTTON}). ` +
        `No visa entry may exist or the remove icon is not visible. Original: ${err.message}`
      );
    }
  }

  async confirmRemovePassportVisa() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
      // Wait for dialog to close and any triggered API call to complete
      await confirmBtn.waitFor({ state: 'hidden', timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmRemovePassportVisa] Could not confirm the delete dialog (selector: ${SELECTORS.CONFIRM_DELETE_BUTTON}). ` +
        `The confirmation dialog may not have appeared after clicking remove. Original: ${err.message}`
      );
    }
  }

}

module.exports = ProfilePage;
