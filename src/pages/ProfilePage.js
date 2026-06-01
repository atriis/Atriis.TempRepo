const SELECTORS = {
  // Navigation to profile
  PASSENGER_AVATAR: '.passenger-avatar',
  USER_PROFILE_LINK: '.user-profile-link',

  // Profile tabs
  FREQUENT_PROGRAMS_TAB: '#tab-frequentPrograms',
  CONTACT_INFORMATION_TAB: "[id='tab-contactInformation'] p",

  // Contact information form
  CONTACT_INFO_FORM: '.contact-info-form-content',
  BUSINESS_PHONE_INPUTS: '.contact-info-form-content .phone-inputs-container .field.app-column.is-3:nth-child(2) .phone-inputs input',
  STATE_LABEL: '.contact-info-form-content > :nth-child(6) > :nth-child(5) .label',
  STATE_VALUE: '.contact-info-form-content > :nth-child(6) > :nth-child(5) .el-select__placeholder span',

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

  // Frequent Programs form
  FREQUENT_PROGRAMS_FORM: '.frequent-programs-form',
  FREQUENT_PROGRAMS_INPUTS: '.frequent-programs-inputs',
  ADD_FREQUENT_FLYER_BUTTON: '.add-loyalty-btn',
  REMOVE_ENTRY_BUTTON: '.remove-btn-wrapper .remove-btn',
  FF_NUMBER_INPUT: '.el-input__inner',
  FF_CARRIER_DROPDOWN: '.el-select',
  SAVE_BUTTON: 'button:has-text("Save Frequent Programs")',

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


}

module.exports = ProfilePage;
