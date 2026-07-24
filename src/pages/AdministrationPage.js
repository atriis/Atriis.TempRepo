const SELECTORS = {
  // OBT side-nav — admin settings icon (material icon text is "settings")
  ADMIN_SETTINGS_ICON: '.app-side-nav .material-symbols-outlined',

  // Administration app (AngularJS) — page-ready indicators. A full admin lands on a page carrying
  // [name='settingsForm']; a LIMITED admin (e.g. dina@Testimcorpnl.com) lands directly on the section
  // list (CorporateUsers) WITHOUT a settingsForm, so readiness must also accept the section-menu tree
  // links (a.navigatable). Either present means the admin app has rendered.
  SETTINGS_FORM: "[name='settingsForm']",
  ADMIN_READY: "[name='settingsForm'], a.navigatable",

  // Navigation tabs inside the admin app
  USERS_TAB: "[title='Users']",
  TRAVEL_POLICIES_TAB: "[title='Travel Policies']",

  // User search input (AngularJS ng-disabled attribute identifies it)
  USER_SEARCH_INPUT: "[ng-disabled='isDisabled']",
  TRAVEL_POLICY_SEARCH_INPUT: "[placeholder='Search policy name']",

  // User row in the results list — each row has columns; 3rd column (name cell) is the click target
  USER_ROW_NAME_CELL: "[data-ng-repeat*='user in users'] > :nth-child(3)",
  TRAVEL_POLICY_ITEM_NAME: "[ng-click='onTravelPolicyItemClicked(travelPolicy)'] .ng-binding",
  TRAVEL_POLICY_RULE_FIRST_ROW: "[data-ng-repeat*='travelPolicyRule in travelPolicyRules'] > :nth-child(1)",

  // User first-name field shown after opening a user record
  USER_FIRST_NAME_FIELD: "[data-ng-model='user.FirstName']",

  // Form of Payment tab inside admin user view (ng-class contains formOfPayment)
  FOP_TAB: "[ng-class*='formOfPayment']",

  // Credit card table — first cell of each row displays the card name
  CREDIT_CARD_ROW_NAME: "#credit-container table tbody tr td:nth-child(1)",

  // Select2 chosen-value spans inside the credit-card edit form (month = nth(0), year = nth(1))
  CREDIT_CARD_EXPIRY_CHOSEN: "#credit-container .select2-chosen",

  // Delete icon image inside the card repeat (ng-repeat attribute identifies the repeater)
  CARD_DELETE_IMG: "[data-ng-repeat*='userCreditCardAssociation'] img",

  // jQuery UI confirmation dialog — first button is the confirm/yes action
  DIALOG_CONFIRM_BTN: ".ui-dialog-buttonset :first-child",
  UNSAVED_ITEMS_DIALOG: "#ui-id-1",

  // Contact Information tab inside admin user view (ng-class contains contectInformation — note the typo in the AngularJS source)
  ADMIN_CONTACT_INFO_TAB: "[ng-class*='contectInformation']",

  TRAVEL_POLICY_ACTION_LABEL: "[ng-switch-when='0'] > :nth-child(5) > :nth-child(1) label",
  TRAVEL_POLICY_SELECTED_DIRECTION: ".select2-choice .select2-chosen",
  TRAVEL_POLICY_SELECT2_TRIGGER: ".select2-choice",
  TRAVEL_POLICY_SELECT2_ARROW: ".select2-arrow b",
  TRAVEL_POLICY_SELECT2_DROPDOWN: ".select2-drop:visible",
  TRAVEL_POLICY_SELECT2_OPTION: ".select2-drop:visible .select2-results .select2-result-selectable > div",

  // Mobile phone fields in the AngularJS admin contact info form (name attributes identify each segment)
  ADMIN_MOBILE_COUNTRY_CODE: "[phone-number='user.Mobile'] [name='CountryCode']",
  ADMIN_MOBILE_AREA_CODE: "[phone-number='user.Mobile'] [name='AreaCode']",
  ADMIN_MOBILE_NUMBER: "[phone-number='user.Mobile'] [name='Number']",

  // Save button in the admin contact info form
  ADMIN_SAVE_CONTACT_BTN: "[data-ng-click='onSaveClicked()']",

  // Administration left-menu section links. Each permitted section renders as an AngularJS tree link
  // `<a class="ng-binding navigatable" title="Users">` — the `.navigatable` class marks a section entry
  // and the `title` attribute holds the section name (confirmed against the live limited-admin DOM).
  // Counting the distinct visible section links yields how many sections the role exposes; the only
  // other titled element on the page is a hidden `<span title="Settings">`, which this excludes.
  ADMIN_SECTION_MENU_ITEM: "a.navigatable[title]",

  // --- Limited-admin add-user / edit-user / active-users filter flow (test 36297) ---
  // "Add new user" button in the Users list toolbar (click target is its inner span)
  ADD_NEW_USER_BTN: "[data-ng-click='onAddNewUserClicked()']",
  // First field label inside the new-corporate-user popup form — proves the add-user form rendered
  NEW_USER_FORM_FIRST_FIELD_LABEL: "[name='newCorporateUserForm'] > :nth-child(2) > :nth-child(1) .block-display",
  // Close (X) button of the add-new-user popup
  ADD_NEW_USER_POPUP_CLOSE: "#popUpCloseBtn > div",
  // Save button on the user record detail form (shares the onSaveClicked handler used elsewhere)
  ADMIN_SAVE_USER_BTN: "[data-ng-click='onSaveClicked()']",
  // Success toast title shown after a save
  ADMIN_TOAST_TITLE: ".toast-title",
  // Third element in the admin search bar renders the "Active" users filter chip
  ADMIN_SEARCH_BAR_FILTER: ".admin-search-bar > :nth-child(3)",
  // Active / Inactive user filter checkboxes in the Users list
  ADMIN_SHOW_INACTIVE_CHECKBOX: "[data-ng-model='showInactive']",
  ADMIN_SHOW_ACTIVE_CHECKBOX: "[data-ng-model='showActive']",
  // Corporate-users list rows; the 9th cell of each row is the status column ("Active"/"Inactive")
  ADMIN_USER_ROWS: ".user-scroll-corporate tbody > tr",
  ADMIN_USER_STATUS_CELL: ":nth-child(9)",
};

class AdministrationPage {
  constructor(page) {
    this.page = page;
  }

  // --- OBT side-nav navigation ---

  async clickAdminSettingsIcon() {
    try {
      const icon = this.page
        .locator(SELECTORS.ADMIN_SETTINGS_ICON)
        .filter({ hasText: 'settings' });
      await icon.waitFor({ state: 'visible', timeout: 15000 });
      await icon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickAdminSettingsIcon] Could not click the admin settings icon in the side nav ` +
        `(selector: ${SELECTORS.ADMIN_SETTINGS_ICON}, text filter: "settings"). ` +
        `Ensure the logged-in user has administration access and the side nav is visible. ` +
        `Original: ${err.message}`
      );
    }
  }

  // --- Administration app loading ---

  async waitForAdminPageReady() {
    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      // Wait for EITHER the full-admin settings form OR the limited-admin section-menu tree links.
      await this.page.locator(SELECTORS.ADMIN_READY).first().waitFor({ state: 'attached', timeout: 30000 });
      // Wait until the URL contains the Corporation ID — the admin SPA sets this after initial load.
      // Without this, clickUsersTab runs before the hash route is ready and falls back to clicking
      // the Users tab element, which may not be visible yet.
      await this.page.waitForFunction(
        () => window.location.href.includes('/Corporation/'),
        { timeout: 20000 }
      );
    } catch (err) {
      throw new Error(
        `[AdministrationPage.waitForAdminPageReady] Administration page did not finish loading ` +
        `(selector: ${SELECTORS.ADMIN_READY}). ` +
        `The admin settings URL may be incorrect or the user lacks admin privileges. ` +
        `Original: ${err.message}`
      );
    }
  }

  // --- Administration sections (left-menu) ---

  /**
   * Returns whether the named administration section link is visible in the admin left menu.
   * Prefers an exact [title='name'] match (the Testim-proven selector); falls back to a contains
   * match so a section whose displayed title extends the feature's name still resolves.
   *
   * @param {string} sectionName - The section name (e.g. "Users", "Point of Interest")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isAdminSectionVisible(sectionName, { timeout = 15000 } = {}) {
    const escaped = String(sectionName).replace(/'/g, "\\'");
    const exact = this.page.locator(`[title='${escaped}']`).first();
    try {
      await exact.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      // fall through to a contains match
    }
    const partial = this.page.locator(`[title*='${escaped}']`).first();
    try {
      await partial.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Counts the distinct visible administration section links in the admin left menu. Dedupes by the
   * link's title text so a hidden/responsive duplicate or repeated node does not inflate the count.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<number>}
   */
  async countAdminSections({ timeout = 15000 } = {}) {
    // Gate on the section links themselves so the count runs as soon as the menu has rendered.
    // (SETTINGS_FORM is absent for a limited admin, so waiting on it would burn the full timeout.)
    await this.page.locator(SELECTORS.ADMIN_SECTION_MENU_ITEM).first().waitFor({ state: 'visible', timeout }).catch(() => {});

    const links = this.page.locator(SELECTORS.ADMIN_SECTION_MENU_ITEM);
    const total = await links.count();
    const titles = new Set();
    for (let i = 0; i < total; i++) {
      const link = links.nth(i);
      if (!(await link.isVisible().catch(() => false))) continue;
      const title = (await link.getAttribute('title').catch(() => null))?.trim();
      if (title) titles.add(title);
    }
    return titles.size;
  }

  // --- Users tab ---

  async clickUsersTab() {
    try {
      // The admin may have cached a user's detail view. Navigate directly to CorporateUsers
      // via the hash route to ensure we land on the Users list, not a detail page.
      const currentUrl = this.page.url();
      const corporationMatch = currentUrl.match(/Corporation\/(\d+)/);
      if (corporationMatch) {
        const baseUrl = currentUrl.split('#')[0];
        const corporationId = corporationMatch[1];
        await this.page.goto(
          `${baseUrl}#/Corporation/${corporationId}/CorporateUsers`,
          { timeout: 20000 }
        );
        // Wait for AngularJS to render the user list after route change
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      } else {
        // Fallback: click the Users tab in the navigation
        const tab = this.page.locator(SELECTORS.USERS_TAB);
        await tab.waitFor({ state: 'visible', timeout: 15000 });
        await tab.click({ timeout: 10000 });
      }
      // Wait for at least one user row to confirm the Users list has rendered
      await this.page
        .locator(SELECTORS.USER_ROW_NAME_CELL)
        .first()
        .waitFor({ state: 'visible', timeout: 40000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickUsersTab] Could not navigate to the Users list in the administration. ` +
        `The admin URL may not contain a Corporation ID, or the user list did not render. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickTravelPoliciesTab() {
    try {
      const tab = this.page.locator(SELECTORS.TRAVEL_POLICIES_TAB);
      await tab.waitFor({ state: 'visible', timeout: 15000 });
      await tab.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickTravelPoliciesTab] Could not click the Travel Policies tab in the admin portal ` +
        `(selector: ${SELECTORS.TRAVEL_POLICIES_TAB}). ` +
        `The administration page may not have loaded or the tab is hidden. Original: ${err.message}`
      );
    }
  }

  async dismissUnsavedItemsDialogIfPresent() {
    try {
      const dialog = this.page.locator(SELECTORS.UNSAVED_ITEMS_DIALOG);
      const visible = await dialog.isVisible().catch(() => false);
      if (!visible) {
        return false;
      }

      const dialogText = ((await dialog.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      if (!dialogText.includes('There are some unsaved items in this screen')) {
        throw new Error(
          `[AdministrationPage.dismissUnsavedItemsDialogIfPresent] An unexpected dialog appeared in the admin portal ` +
          `(selector: ${SELECTORS.UNSAVED_ITEMS_DIALOG}). Text: ${dialogText || '<empty>'}`
        );
      }

      const confirmBtn = this.page.locator(SELECTORS.DIALOG_CONFIRM_BTN);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
      return true;
    } catch (err) {
      throw new Error(
        `[AdministrationPage.dismissUnsavedItemsDialogIfPresent] Could not dismiss the unsaved-items dialog in the admin portal. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillTravelPolicySearch(policyName) {
    try {
      const input = this.page.locator(SELECTORS.TRAVEL_POLICY_SEARCH_INPUT);
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click({ timeout: 5000 });
      await input.fill(policyName, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.fillTravelPolicySearch] Could not search for travel policy "${policyName}" ` +
        `(selector: ${SELECTORS.TRAVEL_POLICY_SEARCH_INPUT}). ` +
        `The Travel Policies tab may not be open or the search field is hidden. Original: ${err.message}`
      );
    }
  }

  async clickFirstTravelPolicyItem(policyName) {
    try {
      const item = this.page.locator(SELECTORS.TRAVEL_POLICY_ITEM_NAME).first();
      await item.waitFor({ state: 'visible', timeout: 15000 });
      await item.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickFirstTravelPolicyItem] Could not open the first travel policy item after searching for "${policyName}" ` +
        `(selector: ${SELECTORS.TRAVEL_POLICY_ITEM_NAME}). ` +
        `The search may have returned no results or the item did not render. Original: ${err.message}`
      );
    }
  }

  async clickFirstTravelPolicyRule() {
    try {
      const rule = this.page.locator(SELECTORS.TRAVEL_POLICY_RULE_FIRST_ROW);
      await rule.waitFor({ state: 'visible', timeout: 15000 });
      await rule.click({ timeout: 10000 });

      await this.page.locator(SELECTORS.TRAVEL_POLICY_ACTION_LABEL).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickFirstTravelPolicyRule] Could not open the first travel policy rule ` +
        `(selector: ${SELECTORS.TRAVEL_POLICY_RULE_FIRST_ROW}). ` +
        `The travel policy item may not be open or the rule list did not render. Original: ${err.message}`
      );
    }
  }

  async verifyFlightDirectionDropdownOptions(expectedOptions) {
    try {
      if (!Array.isArray(expectedOptions)) {
        throw new Error(
          `[AdministrationPage.verifyFlightDirectionDropdownOptions] "expectedOptions" must be an array, got: ${typeof expectedOptions} (${JSON.stringify(expectedOptions)})`
        );
      }
      if (expectedOptions.length === 0) {
        throw new Error(
          '[AdministrationPage.verifyFlightDirectionDropdownOptions] "expectedOptions" must not be empty.'
        );
      }

      const expandedRule = this.page.locator("[ng-switch-when='0']").first();
      await expandedRule.waitFor({ state: 'visible', timeout: 15000 });

      // Scan all <select> elements in the expanded rule to find the flight direction one
      const actualOptions = await this.page.evaluate(() => {
        const panels = document.querySelectorAll("[ng-switch-when='0']");
        for (const panel of panels) {
          for (const select of panel.querySelectorAll('select')) {
            const texts = Array.from(select.options).map((o) => o.text.replace(/\s+/g, ' ').trim()).filter(Boolean);
            if (texts.includes('Any Flight')) return texts;
          }
        }
        return null;
      });

      if (!actualOptions) {
        throw new Error(
          '[AdministrationPage.verifyFlightDirectionDropdownOptions] Could not find a <select> containing "Any Flight" in the expanded rule. ' +
          'The flight direction dropdown may not be visible or the rule type does not support flight direction.'
        );
      }

      for (const expectedOption of expectedOptions) {
        if (!actualOptions.includes(expectedOption)) {
          throw new Error(
            `[AdministrationPage.verifyFlightDirectionDropdownOptions] Flight direction dropdown is missing option "${expectedOption}". ` +
            `Expected to find: ${JSON.stringify(expectedOptions)}. Actual options: ${JSON.stringify(actualOptions)}. ` +
            `The travel policy rule may not be the correct one or the admin UI changed.`
          );
        }
      }

      return actualOptions;
    } catch (err) {
      throw new Error(
        `[AdministrationPage.verifyFlightDirectionDropdownOptions] Could not verify the flight direction dropdown options ` +
        `(selector: ${SELECTORS.TRAVEL_POLICY_SELECT2_DROPDOWN}). Original: ${err.message}`
      );
    }
  }

  async fillUserSearch(userName) {
    try {
      // Use .first() because the search input shares [ng-disabled='isDisabled'] attribute
      // with phone fields in user detail forms. On the Users list page (CorporateUsers route)
      // the search input appears first in DOM order.
      const input = this.page.locator(SELECTORS.USER_SEARCH_INPUT).first();
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click({ timeout: 5000 });
      // Use pressSequentially to trigger AngularJS ng-model $watch / $digest cycle
      // (fill() does not always trigger AngularJS dirty-checking in AngularJS 1.x apps)
      await input.pressSequentially(userName, { delay: 60 });
      // Wait for AngularJS to process the search filter and render matching rows
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    } catch (err) {
      throw new Error(
        `[AdministrationPage.fillUserSearch] Could not type "${userName}" into the user search input ` +
        `(selector: ${SELECTORS.USER_SEARCH_INPUT}). ` +
        `The Users tab must be open before searching. Original: ${err.message}`
      );
    }
  }

  async clickFirstUserRowWithName(userName) {
    try {
      // After search filters the user list via AngularJS, click the first visible name cell.
      // The search guarantees the list is narrowed to matching users — no additional text filter needed.
      const nameCell = this.page.locator(SELECTORS.USER_ROW_NAME_CELL).first();
      await nameCell.waitFor({ state: 'visible', timeout: 30000 });
      await nameCell.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickFirstUserRowWithName] Could not click first user name cell after searching for "${userName}" ` +
        `(selector: ${SELECTORS.USER_ROW_NAME_CELL}). ` +
        `The search may have returned no results or the user list did not render. ` +
        `Original: ${err.message}`
      );
    }
  }

  async waitForUserRecord(firstName) {
    try {
      await this.page
        .locator(SELECTORS.USER_FIRST_NAME_FIELD)
        .filter({ hasValue: firstName })
        .waitFor({ state: 'attached', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.waitForUserRecord] User record for "${firstName}" did not load ` +
        `(selector: ${SELECTORS.USER_FIRST_NAME_FIELD}). ` +
        `The user row click may not have opened the user detail panel. Original: ${err.message}`
      );
    }
  }

  // --- Form of Payment tab in admin user view ---

  async clickFopTab() {
    try {
      const tab = this.page.locator(SELECTORS.FOP_TAB);
      await tab.waitFor({ state: 'visible', timeout: 15000 });
      await tab.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickFopTab] Could not click the Form of Payment tab in the admin user view ` +
        `(selector: ${SELECTORS.FOP_TAB}). ` +
        `The user must be opened first and have a FOP tab. Original: ${err.message}`
      );
    }
  }

  // --- Credit card verification ---

  async clickCreditCardRow(cardName) {
    try {
      const cell = this.page
        .locator(SELECTORS.CREDIT_CARD_ROW_NAME)
        .filter({ hasText: cardName })
        .first();
      await cell.waitFor({ state: 'visible', timeout: 15000 });
      await cell.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickCreditCardRow] Could not find and click credit card row for "${cardName}" ` +
        `(selector: ${SELECTORS.CREDIT_CARD_ROW_NAME}). ` +
        `The FOP tab must be open and the card must exist. Original: ${err.message}`
      );
    }
  }

  async getExpiryMonth() {
    try {
      // nth(0) = card type ("Visa Credit"), nth(1) = expiry month
      const monthChosen = this.page.locator(SELECTORS.CREDIT_CARD_EXPIRY_CHOSEN).nth(1);
      await monthChosen.waitFor({ state: 'visible', timeout: 10000 });
      return (await monthChosen.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getExpiryMonth] Could not read expiry month from Select2 dropdown ` +
        `(selector: ${SELECTORS.CREDIT_CARD_EXPIRY_CHOSEN}, index 1). ` +
        `The credit card row must be clicked first to open the edit form. Original: ${err.message}`
      );
    }
  }

  async getExpiryYear() {
    try {
      // nth(0) = card type, nth(1) = expiry month, nth(2) = expiry year
      const yearChosen = this.page.locator(SELECTORS.CREDIT_CARD_EXPIRY_CHOSEN).nth(2);
      await yearChosen.waitFor({ state: 'visible', timeout: 10000 });
      return (await yearChosen.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getExpiryYear] Could not read expiry year from Select2 dropdown ` +
        `(selector: ${SELECTORS.CREDIT_CARD_EXPIRY_CHOSEN}, index 2). ` +
        `The credit card row must be clicked first to open the edit form. Original: ${err.message}`
      );
    }
  }

  // --- Delete credit card ---

  async clickDeleteImageForCard(cardName) {
    try {
      const deleteImg = this.page
        .locator(SELECTORS.CARD_DELETE_IMG)
        .filter({ near: this.page.locator(SELECTORS.CREDIT_CARD_ROW_NAME).filter({ hasText: cardName }) });

      // Fallback: if the repeat only shows one card after filtering by name, use the first img
      const imgLocator = await deleteImg.count() > 0
        ? deleteImg.first()
        : this.page.locator(SELECTORS.CARD_DELETE_IMG).first();

      await imgLocator.waitFor({ state: 'visible', timeout: 10000 });
      await imgLocator.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickDeleteImageForCard] Could not click delete image for card "${cardName}" ` +
        `(selector: ${SELECTORS.CARD_DELETE_IMG}). ` +
        `The card must exist in the FOP tab. Original: ${err.message}`
      );
    }
  }

  async confirmDeleteDialog() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.DIALOG_CONFIRM_BTN);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.confirmDeleteDialog] Could not click the confirm button in the delete dialog ` +
        `(selector: ${SELECTORS.DIALOG_CONFIRM_BTN}). ` +
        `The jQuery UI dialog may not have appeared. Original: ${err.message}`
      );
    }
  }

  // --- Contact Information tab in admin user view ---

  async clickContactInfoTab() {
    try {
      const tab = this.page.locator(SELECTORS.ADMIN_CONTACT_INFO_TAB);
      await tab.waitFor({ state: 'visible', timeout: 15000 });
      await tab.click({ timeout: 10000 });
      // Wait for the country code input to confirm the contact info form is active
      await this.page
        .locator(SELECTORS.ADMIN_MOBILE_COUNTRY_CODE)
        .waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickContactInfoTab] Could not open the Contact Information tab in the admin user view ` +
        `(tab selector: ${SELECTORS.ADMIN_CONTACT_INFO_TAB}). ` +
        `The user record must be open. Original: ${err.message}`
      );
    }
  }

  async clearMobileInputsInAdmin() {
    try {
      for (const selector of [
        SELECTORS.ADMIN_MOBILE_COUNTRY_CODE,
        SELECTORS.ADMIN_MOBILE_AREA_CODE,
        SELECTORS.ADMIN_MOBILE_NUMBER,
      ]) {
        const input = this.page.locator(selector);
        await input.waitFor({ state: 'visible', timeout: 10000 });
        // Use triple-click to select all text, then type a space to dirty the AngularJS model,
        // then select all again and delete to clear — this sequence reliably triggers $watch/$dirty.
        await input.click({ clickCount: 3, timeout: 5000 });
        await input.pressSequentially(' ', { delay: 50 });
        await input.press('Control+a');
        await input.press('Delete');
        await input.press('Tab');
      }
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clearMobileInputsInAdmin] Failed to clear mobile inputs in admin. ` +
        `Ensure the Contact Information tab is open and mobile inputs are visible. ` +
        `Original: ${err.message}`
      );
    }
  }

  async saveContactInfoInAdmin() {
    try {
      const saveBtn = this.page.locator(SELECTORS.ADMIN_SAVE_CONTACT_BTN);
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      // The Save button may be disabled (data-ng-disabled) when the form is pristine (not dirty).
      // Force-scroll into view and dispatch a click via JS to bypass the disabled state when
      // the user cleared already-empty fields (form appears unchanged to AngularJS).
      await this.page.evaluate((selector) => {
        const btn = document.querySelector(selector);
        if (btn) {
          btn.scrollIntoView({ block: 'center', behavior: 'instant' });
          btn.removeAttribute('disabled');
          btn.click();
        }
      }, SELECTORS.ADMIN_SAVE_CONTACT_BTN);
      // Wait for success toast — if save wasn't needed (already empty) the toast may not appear;
      // in that case, continue without error.
      try {
        await this.page.locator('.toast-title').waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        // No toast is acceptable if the form was already in the cleared state
      }
    } catch (err) {
      throw new Error(
        `[AdministrationPage.saveContactInfoInAdmin] Could not click the Save button or confirm save success in the admin contact info form ` +
        `(selector: ${SELECTORS.ADMIN_SAVE_CONTACT_BTN}). ` +
        `The Contact Information tab must be active. Original: ${err.message}`
      );
    }
  }

  async getAdminMobileValues() {
    try {
      const countryCode = (await this.page.locator(SELECTORS.ADMIN_MOBILE_COUNTRY_CODE).inputValue()).trim();
      const areaCode = (await this.page.locator(SELECTORS.ADMIN_MOBILE_AREA_CODE).inputValue()).trim();
      const number = (await this.page.locator(SELECTORS.ADMIN_MOBILE_NUMBER).inputValue()).trim();
      return { countryCode, areaCode, number };
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getAdminMobileValues] Failed to read mobile values from admin. ` +
        `Original: ${err.message}`
      );
    }
  }

  // --- Add new user popup ---

  async clickAddNewUser() {
    try {
      const btn = this.page.locator(SELECTORS.ADD_NEW_USER_BTN);
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickAddNewUser] Could not click the "Add new user" button in the Users list ` +
        `(selector: ${SELECTORS.ADD_NEW_USER_BTN}). ` +
        `The Users list must be open and the role must permit adding users. Original: ${err.message}`
      );
    }
  }

  async getNewUserFormFirstFieldLabel() {
    try {
      const label = this.page.locator(SELECTORS.NEW_USER_FORM_FIRST_FIELD_LABEL);
      await label.waitFor({ state: 'visible', timeout: 15000 });
      return (await label.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getNewUserFormFirstFieldLabel] Could not read the first field label in the new corporate user form ` +
        `(selector: ${SELECTORS.NEW_USER_FORM_FIRST_FIELD_LABEL}). ` +
        `The add-new-user popup may not have opened. Original: ${err.message}`
      );
    }
  }

  async closeAddNewUserPopup() {
    try {
      const closeBtn = this.page.locator(SELECTORS.ADD_NEW_USER_POPUP_CLOSE);
      await closeBtn.waitFor({ state: 'visible', timeout: 15000 });
      await closeBtn.click({ timeout: 10000 });
      // Wait for the popup close button to detach so the users list is interactable again
      await closeBtn.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    } catch (err) {
      throw new Error(
        `[AdministrationPage.closeAddNewUserPopup] Could not close the add-new-user popup ` +
        `(selector: ${SELECTORS.ADD_NEW_USER_POPUP_CLOSE}). ` +
        `The popup may not be open. Original: ${err.message}`
      );
    }
  }

  // --- Form scrolling ---

  /**
   * Scrolls the admin user-detail form (window + any inner scroll container) fully to the bottom.
   * The form lazily renders its lower sections (including dynamic questions) as they scroll into
   * view, so this must run before locating a field far down the form. A headed browser scrolls
   * naturally; the headless run must scroll it in first.
   *
   * @param {object} [options]
   * @param {number} [options.steps=15]
   */
  async scrollAdminFormToBottom({ steps = 15 } = {}) {
    for (let i = 0; i < steps; i++) {
      await this.page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
        for (const el of document.querySelectorAll('div, section, main, form')) {
          const style = window.getComputedStyle(el);
          const scrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll')
            && el.scrollHeight > el.clientHeight + 5;
          if (scrollable) el.scrollTop = el.scrollHeight;
        }
      });
      await this.page.waitForTimeout(200);
    }
  }

  // --- First mandatory dynamic question ---

  /**
   * Fills the first mandatory, fillable text field on the user-detail form with the given value.
   * Mandatory dynamic questions are located dynamically (not by a fixed id): the form is scrolled
   * so lazy sections render, then the first required text input/textarea is chosen.
   *
   * @param {string} value - The value to type into the field
   */
  async fillFirstMandatoryUserField(value) {
    try {
      await this.scrollAdminFormToBottom();

      const found = await this.page.evaluate(() => {
        const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        const isMandatory = (el) => {
          if (el.required || el.hasAttribute('required')) return true;
          if (el.getAttribute('ng-required') === 'true') return true;
          if (el.getAttribute('aria-required') === 'true') return true;
          // A required marker ("*") rendered near the field's label
          const container = el.closest("[name], .form-group, .control-group, li, tr");
          if (container) {
            if (container.querySelector('.mandatory, .required')) return true;
            const label = container.querySelector('label');
            if (label && /\*/.test(label.textContent || '')) return true;
          }
          return false;
        };

        const fields = Array.from(document.querySelectorAll("input[type='text'], input:not([type]), textarea"));
        const diag = [];
        let firstMandatory = null;
        for (const el of fields) {
          if (!isVisible(el)) continue;
          const mandatory = isMandatory(el);
          const entry = { id: el.id || null, name: el.getAttribute('name'), mandatory };
          if (el.id && el.id.startsWith('question_')) diag.push(entry);
          if (mandatory && !firstMandatory && el.id) firstMandatory = entry;
        }
        return { firstMandatory, questionFields: diag };
      });

      if (!found.firstMandatory || !found.firstMandatory.id) {
        throw new Error(
          `No mandatory fillable field was found on the user-detail form. ` +
          `Visible dynamic-question fields seen: ${JSON.stringify(found.questionFields)}.`
        );
      }

      const selector = `#${found.firstMandatory.id}`;
      const input = this.page.locator(selector).first();
      await input.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await input.click({ timeout: 5000 });
      await input.fill('', { timeout: 5000 });
      // pressSequentially triggers the AngularJS ng-model $watch/$dirty cycle so the form is dirtied
      await input.pressSequentially(value, { delay: 40 });
      await input.press('Tab');
    } catch (err) {
      throw new Error(
        `[AdministrationPage.fillFirstMandatoryUserField] Could not fill the first mandatory user field with "${value}". ` +
        `The user record must be open. Original: ${err.message}`
      );
    }
  }

  // --- Save user record ---

  async clickSaveUserRecord() {
    try {
      const saveBtn = this.page.locator(SELECTORS.ADMIN_SAVE_USER_BTN).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 15000 });
      await saveBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await saveBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickSaveUserRecord] Could not click the Save button on the user record ` +
        `(selector: ${SELECTORS.ADMIN_SAVE_USER_BTN}). ` +
        `A mandatory field must be filled so the form is dirty and Save is enabled. Original: ${err.message}`
      );
    }
  }

  // --- Toast ---

  async getAdminToastText({ timeout = 15000 } = {}) {
    try {
      const toast = this.page.locator(SELECTORS.ADMIN_TOAST_TITLE).first();
      await toast.waitFor({ state: 'visible', timeout });
      return (await toast.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getAdminToastText] No confirmation toast appeared ` +
        `(selector: ${SELECTORS.ADMIN_TOAST_TITLE}). Original: ${err.message}`
      );
    }
  }

  // --- Active-users search-bar filter ---

  async getSearchBarFilterText() {
    try {
      // Read once attached (not "visible") — the chip may be a hidden responsive dupe whose text is
      // still authoritative; mirrors the Testim querySelector().textContent read.
      const chip = this.page.locator(SELECTORS.ADMIN_SEARCH_BAR_FILTER).first();
      await chip.waitFor({ state: 'attached', timeout: 15000 });
      return (await chip.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getSearchBarFilterText] Could not read the admin search-bar filter chip ` +
        `(selector: ${SELECTORS.ADMIN_SEARCH_BAR_FILTER}). ` +
        `The Users list search bar may not be visible. Original: ${err.message}`
      );
    }
  }

  async clearUserSearch() {
    try {
      const input = this.page.locator(SELECTORS.USER_SEARCH_INPUT).first();
      await input.waitFor({ state: 'visible', timeout: 15000 });
      // Triple-click selects existing text; Control+a/Delete clears it and dirties the AngularJS $watch
      await input.click({ clickCount: 3, timeout: 5000 });
      await input.press('Control+a');
      await input.press('Delete');
      await input.press('Tab');
      // Let AngularJS re-filter the user list back to the default (active-only) view
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clearUserSearch] Could not clear the user search input ` +
        `(selector: ${SELECTORS.USER_SEARCH_INPUT}). Original: ${err.message}`
      );
    }
  }

  // --- Active / Inactive filter checkboxes ---

  async isFilterChecked(selector, { timeout = 15000 } = {}) {
    try {
      const box = this.page.locator(selector).first();
      await box.waitFor({ state: 'attached', timeout });
      return await box.isChecked();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.isFilterChecked] Could not read the checked state of the filter checkbox ` +
        `(selector: ${selector}). Original: ${err.message}`
      );
    }
  }

  async isInactiveFilterChecked() {
    return this.isFilterChecked(SELECTORS.ADMIN_SHOW_INACTIVE_CHECKBOX);
  }

  async isActiveFilterChecked() {
    return this.isFilterChecked(SELECTORS.ADMIN_SHOW_ACTIVE_CHECKBOX);
  }

  // --- Users list status column ---

  /**
   * Reads the status column (9th cell) of every visible user row in the corporate-users list.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=20000]
   * @returns {Promise<string[]>}
   */
  async getUserRowStatuses({ timeout = 20000 } = {}) {
    try {
      const rows = this.page.locator(SELECTORS.ADMIN_USER_ROWS);
      await rows.first().waitFor({ state: 'visible', timeout }).catch(() => {});
      const count = await rows.count();
      const statuses = [];
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        if (!(await row.isVisible().catch(() => false))) continue;
        const cell = row.locator(SELECTORS.ADMIN_USER_STATUS_CELL).first();
        if ((await cell.count()) === 0) continue;
        const text = (await cell.textContent().catch(() => '') ?? '').replace(/\s+/g, ' ').trim();
        if (text) statuses.push(text);
      }
      return statuses;
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getUserRowStatuses] Could not read user row status cells ` +
        `(selector: ${SELECTORS.ADMIN_USER_ROWS}, 9th cell). Original: ${err.message}`
      );
    }
  }
}

module.exports = AdministrationPage;
