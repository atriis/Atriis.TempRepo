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
}

module.exports = ProfilePage;
