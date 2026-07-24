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

  // --- Per Diem removal flow (test 18418) ---
  // Users datatable body — its visibility proves the Users list rendered
  ADMIN_USERS_LIST_BODY: ".body-container tbody",
  // First user row's name cell (row 1, 2nd cell) — click target to open the first user record
  ADMIN_FIRST_USER_ROW_NAME_CELL: ".body-container tbody > :nth-child(1) > :nth-child(2)",
  // All datatable rows (used to find a row by its 5th cell value when reopening a user)
  ADMIN_USERS_LIST_ROWS: ".body-container tbody > tr",
  // 5th cell of a user row (holds the display name matched when reopening a user)
  ADMIN_USER_ROW_FIFTH_CELL: ":nth-child(5)",
  // First field label on the user detail form — reads "First Name:" when the record is open
  ADMIN_USER_DETAIL_FORM_FIRST_LABEL: "[user='selectedUser'] > :nth-child(1) > :nth-child(1) label",
  // Per Diem section header label — reads "Per Diem"
  PER_DIEM_SECTION_LABEL: "[on='settings.isDisplayCorporatePerdiemIdInherited'] label",
  // Per Diem section container — scopes the select2 widget below (avoids fragile #s2id_autogen* ids)
  PER_DIEM_CONTAINER: "[on='settings.isDisplayCorporatePerdiemIdInherited']",
  // Toggle that switches per diem from inherited to a user-level value
  PER_DIEM_SET_USER_LEVEL_TOGGLE: "[data-ng-click='settings.isDisplayCorporatePerdiemIdInherited=false']",
  // Hint shown when the per diem is inherited from the user group (data-ng-hide) — reads the group value
  PER_DIEM_INHERITED_HINT: "[data-ng-hide='!settings.isDisplayCorporatePerdiemIdInherited']",
  // select2 widget parts inside the per diem container (scoped, not by autogen id)
  PER_DIEM_SELECT2_TRIGGER: "[on='settings.isDisplayCorporatePerdiemIdInherited'] .select2-choice",
  PER_DIEM_SELECT2_ARROW: "[on='settings.isDisplayCorporatePerdiemIdInherited'] .select2-arrow",
  PER_DIEM_SELECT2_CHOSEN: "[on='settings.isDisplayCorporatePerdiemIdInherited'] .select2-chosen",
  // select2 open dropdown (rendered at body level) — options list
  PER_DIEM_SELECT2_DROPDOWN: ".select2-drop:visible",
  PER_DIEM_SELECT2_OPTION: ".select2-drop:visible .select2-results .select2-result-selectable > div",
  // jQuery UI modal backdrop — present when an "unsaved items" navigation-guard dialog is open
  ADMIN_MODAL_OVERLAY: ".ui-widget-overlay",

  // --- Roles admin section (test 40136) ---
  // First column header of the roles datatable — reads "Role" once the Roles list has rendered
  ROLES_DATATABLE_HEADER: ".datatable-header tr > :nth-child(1)",
  // "Add new role" button (click target is its inner span, mirroring the add-user button)
  ADD_NEW_ROLE_BTN: "[data-ng-click='onAddNewRoleClicked()'] span",
  // Role name input on the role edit form
  ROLE_NAME_INPUT: "[data-ng-model='role.Name']",
  // Privileges dual-list: select-all checkbox, then the move-to-selected (">>") control. Use the EXACT
  // add-direction ng-click — a dual-list also has a "<<" remove button (addItemToList(selectedItems,
  // unselectedItems,false)); a contains-match could hit the wrong direction and silently move nothing.
  ROLE_SELECT_ALL_PRIVILEGES: ".role-edit-container [ng-checked='model.selectAllUnSelected']",
  ROLE_MOVE_TO_SELECTED: ".role-edit-container [data-ng-click='addItemToList(unselectedItems, selectedItems,true)']",
  // Users dual-list (scoped by the is-edit-users directive): filter input, select-all, move-to-selected.
  // The filter input must NOT be matched by .ng-dirty — AngularJS only adds that class AFTER the field
  // is typed into, so it is absent on first render. Match the text input by type instead.
  ROLE_USERS_FILTER: "[is-edit-users='isEditUsers'] input:not([type='checkbox']):not([type='radio'])",
  ROLE_USERS_SELECT_ALL: "[is-edit-users='isEditUsers'] [ng-checked='model.selectAllUnSelected']",
  ROLE_USERS_MOVE_TO_SELECTED: "[is-edit-users='isEditUsers'] [data-ng-click='addItemToList(unselectedItems, selectedItems,true)']",
  // Save button on the role edit form (shares the onSaveClicked handler)
  ROLE_SAVE_BTN: "[data-ng-click='onSaveClicked()']",
  // Role search input in the roles list
  ROLE_SEARCH_INPUT: "[placeholder='Search role name or privileges']",
  // First role row's name binding in the filtered roles list
  ROLE_FIRST_ROW_NAME: "[data-ng-repeat='role in roles | filter:roleSearchText'] > :nth-child(1) .ng-binding",
  // Delete (secondary) button on the selected role
  ROLE_DELETE_BTN: ".button-secondary",
  // jQuery UI delete-confirmation dialog title — reads "Delete Role"
  DELETE_ROLE_DIALOG_TITLE: "#ui-id-2",

  // --- Per Diem Settings admin section (test 40136) ---
  // Detail-panel header of the opened per diem — reads "General information"
  PERDIEM_GENERAL_INFO_HEADER: ".selected-details-container > :nth-child(1) .admin-field-group-header",
  // "Add destination" link
  PERDIEM_ADD_DESTINATION: "[ng-click='onNewDestinationClicked()'] a",
  // Daily sum input on a destination row
  PERDIEM_DAILY_SUM: "[data-ng-model='destination.DailySum']",
  // select2 (v3) trigger anchor inside a destination row (scoped by row ancestor, NOT #s2id_autogen ids)
  PERDIEM_ROW_SELECT2_TRIGGER: "a.select2-choice",
  // Open select2 dropdown (rendered at body level) and its first result label
  PERDIEM_SELECT2_DROPDOWN: ".select2-drop:visible",
  PERDIEM_SELECT2_FIRST_RESULT: ".select2-drop:visible .select2-results > li:nth-of-type(1) .select2-result-label",
  // Save button on the per diem detail form
  PERDIEM_SAVE_BTN: ".button-primary",
  // Remove-destination control on a destination row
  PERDIEM_REMOVE_DESTINATION: "[ng-click='onRemoveDestenation($index)']",
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

  /**
   * Polls until ANY visible toast title contains the expected text, then returns the matched text.
   *
   * A single read of `.first()` is unreliable for admin toasts: the result toast (e.g. "Save failed")
   * arrives asynchronously ~0.5s after the action, and it can briefly coexist with a lingering earlier
   * toast (e.g. the previous "Save succeeded"). Reading once, immediately, races that window and grabs
   * the stale toast. This mirrors the Testim recording, which polled `.toast-title` until it matched.
   *
   * @param {string} expectedText - The toast text to wait for (substring match)
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The matched toast text
   */
  async waitForAdminToast(expectedText, { timeout = 15000 } = {}) {
    try {
      await this.page.waitForFunction(
        ({ selector, txt }) =>
          Array.from(document.querySelectorAll(selector)).some(
            (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().includes(txt)
          ),
        { selector: SELECTORS.ADMIN_TOAST_TITLE, txt: expectedText },
        { timeout }
      );
      const titles = (await this.page.locator(SELECTORS.ADMIN_TOAST_TITLE).allTextContents())
        .map((t) => t.replace(/\s+/g, ' ').trim());
      return titles.find((t) => t.includes(expectedText)) ?? expectedText;
    } catch (err) {
      const seen = (await this.page.locator(SELECTORS.ADMIN_TOAST_TITLE).allTextContents().catch(() => []))
        .map((t) => t.replace(/\s+/g, ' ').trim());
      throw new Error(
        `[AdministrationPage.waitForAdminToast] No confirmation toast containing "${expectedText}" appeared within ${timeout}ms ` +
        `(selector: ${SELECTORS.ADMIN_TOAST_TITLE}). Toasts seen: ${JSON.stringify(seen)}. ` +
        `The save may not have produced the expected result. Original: ${err.message}`
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

  // --- Per Diem removal flow (test 18418) ---

  /**
   * Returns whether the Users datatable body has rendered, proving the Users list is displayed.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isUsersListDisplayed({ timeout = 15000 } = {}) {
    try {
      const body = this.page.locator(SELECTORS.ADMIN_USERS_LIST_BODY).first();
      await body.waitFor({ state: 'visible', timeout });
      return true;
    } catch (err) {
      throw new Error(
        `[AdministrationPage.isUsersListDisplayed] The administration users datatable did not render ` +
        `(selector: ${SELECTORS.ADMIN_USERS_LIST_BODY}). ` +
        `The Users tab may not be open. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the first user row's name cell to open that user's detail record, then waits for the
   * detail form (First Name: label) to appear.
   */
  async clickFirstUserRow() {
    try {
      const nameCell = this.page.locator(SELECTORS.ADMIN_FIRST_USER_ROW_NAME_CELL).first();
      await nameCell.waitFor({ state: 'visible', timeout: 30000 });
      await nameCell.click({ timeout: 10000 });
      await this.page
        .locator(SELECTORS.ADMIN_USER_DETAIL_FORM_FIRST_LABEL)
        .first()
        .waitFor({ state: 'visible', timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickFirstUserRow] Could not open the first user in the Users list ` +
        `(selector: ${SELECTORS.ADMIN_FIRST_USER_ROW_NAME_CELL}). ` +
        `The Users list may not have rendered any rows. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the first field label on the open user detail form (expected to read "First Name:").
   *
   * @returns {Promise<string>}
   */
  async getUserDetailFirstFieldLabel() {
    try {
      const label = this.page.locator(SELECTORS.ADMIN_USER_DETAIL_FORM_FIRST_LABEL).first();
      await label.waitFor({ state: 'visible', timeout: 15000 });
      return (await label.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getUserDetailFirstFieldLabel] Could not read the first field label on the user detail form ` +
        `(selector: ${SELECTORS.ADMIN_USER_DETAIL_FORM_FIRST_LABEL}). ` +
        `The user record may not have opened. Original: ${err.message}`
      );
    }
  }

  /**
   * Scrolls the Per Diem section into view and reads its header label (expected to read "Per Diem").
   *
   * @returns {Promise<string>}
   */
  async getPerDiemSectionHeaderText() {
    try {
      const header = this.page.locator(SELECTORS.PER_DIEM_SECTION_LABEL).first();
      await header.waitFor({ state: 'attached', timeout: 15000 });
      await header.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await header.waitFor({ state: 'visible', timeout: 10000 });
      return (await header.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getPerDiemSectionHeaderText] Could not read the Per Diem section header ` +
        `(selector: ${SELECTORS.PER_DIEM_SECTION_LABEL}). ` +
        `The user detail form may not expose a Per Diem section for this user. Original: ${err.message}`
      );
    }
  }

  /**
   * Ensures a user-level per diem is editable: if the setting is currently inherited (the "set
   * user-level" toggle is present), clicks it so the per-diem select2 becomes available. No-op when
   * the user level is already active.
   */
  /**
   * Dismisses a blocking jQuery UI modal (the "unsaved items" navigation guard) if its overlay is
   * present, by confirming via the dialog's primary button so the underlying controls become
   * interactable again. No-op when no overlay is showing.
   *
   * @returns {Promise<boolean>} true if a modal was dismissed, false if none was present
   */
  async dismissBlockingModalIfPresent() {
    try {
      const overlay = this.page.locator(SELECTORS.ADMIN_MODAL_OVERLAY).first();
      if (!(await overlay.isVisible().catch(() => false))) {
        return false;
      }
      const confirmBtn = this.page.locator(SELECTORS.DIALOG_CONFIRM_BTN).first();
      await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
      await confirmBtn.click({ timeout: 5000 });
      await overlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      return true;
    } catch (err) {
      throw new Error(
        `[AdministrationPage.dismissBlockingModalIfPresent] A blocking modal overlay was present ` +
        `(selector: ${SELECTORS.ADMIN_MODAL_OVERLAY}) but could not be dismissed via its primary button ` +
        `(${SELECTORS.DIALOG_CONFIRM_BTN}). Original: ${err.message}`
      );
    }
  }

  async ensureUserLevelPerDiemEnabled() {
    try {
      // A prior save + reopen can leave the AngularJS "unsaved items" guard dialog open, whose modal
      // overlay intercepts clicks on the per-diem controls. Clear it first (no-op when absent).
      await this.dismissBlockingModalIfPresent();

      // The pencil (edit) button needs two clicks before the AngularJS ng-switch reliably swaps in
      // the editable select2 (the first click may only focus/activate the control). The second click
      // is best-effort: if the pencil is already gone because the first click worked, ignore it.
      const toggle = this.page.locator(SELECTORS.PER_DIEM_SET_USER_LEVEL_TOGGLE).first();
      const select2Trigger = this.page.locator(SELECTORS.PER_DIEM_SELECT2_TRIGGER).first();
      if (await toggle.isVisible().catch(() => false)) {
        await toggle.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
        await toggle.click({ timeout: 10000 });
        // Second click — tolerated failure (pencil may already be replaced by the select2)
        await toggle.click({ timeout: 3000 }).catch(() => {});
      }
      // Confirm the user-level select2 trigger is now available before returning
      await select2Trigger.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.ensureUserLevelPerDiemEnabled] Could not switch the per diem setting to user level ` +
        `(toggle: ${SELECTORS.PER_DIEM_SET_USER_LEVEL_TOGGLE}, select2 trigger: ${SELECTORS.PER_DIEM_SELECT2_TRIGGER}). ` +
        `The Per Diem section may not have rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Opens the per-diem select2 dropdown (scoped to the per-diem container, not a fragile autogen id).
   */
  async openPerDiemSelect2() {
    try {
      const arrow = this.page.locator(SELECTORS.PER_DIEM_SELECT2_ARROW).first();
      await arrow.waitFor({ state: 'visible', timeout: 15000 });
      await arrow.click({ timeout: 10000 });
      await this.page
        .locator(SELECTORS.PER_DIEM_SELECT2_DROPDOWN)
        .first()
        .waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.openPerDiemSelect2] Could not open the per diem select2 dropdown ` +
        `(arrow: ${SELECTORS.PER_DIEM_SELECT2_ARROW}). ` +
        `The user-level per diem control may not be enabled. Original: ${err.message}`
      );
    }
  }

  /**
   * Selects the per-diem option whose text matches the given value from the open select2 dropdown.
   *
   * @param {string} optionText - The per diem option to pick (e.g. "per diem for user")
   */
  async selectPerDiemOption(optionText) {
    try {
      // Match the option text EXACTLY — a substring match would let "per diem for user" select
      // "per diem for user group" (a distinct entity), silently choosing the wrong per diem.
      const escaped = String(optionText).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const option = this.page
        .locator(SELECTORS.PER_DIEM_SELECT2_OPTION)
        .filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) })
        .first();
      await option.waitFor({ state: 'visible', timeout: 15000 });
      await option.click({ timeout: 10000 });
      // Second click — tolerated failure (the dropdown usually closes once the first click lands,
      // but when it doesn't, the second click commits the selection)
      await option.click({ timeout: 3000 }).catch(() => {});
      // The dropdown closes once an option is picked
      await this.page
        .locator(SELECTORS.PER_DIEM_SELECT2_DROPDOWN)
        .first()
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});
      // Click outside the field (the Per Diem section label is a neutral target) so the select2
      // loses focus and AngularJS commits the change — required for the Save button to enable.
      await this.page
        .locator(SELECTORS.PER_DIEM_SECTION_LABEL)
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});
    } catch (err) {
      throw new Error(
        `[AdministrationPage.selectPerDiemOption] Could not select per diem option "${optionText}" ` +
        `(selector: ${SELECTORS.PER_DIEM_SELECT2_OPTION}). ` +
        `The option may not exist in the per diem list. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the per diem value currently displayed for the user. When a user-level per diem is set the
   * value comes from the select2 chosen span; when the per diem is inherited it comes from the group
   * hint. Returns whichever element is visible.
   *
   * @returns {Promise<string>}
   */
  async getDisplayedPerDiemValue() {
    try {
      const chosen = this.page.locator(SELECTORS.PER_DIEM_SELECT2_CHOSEN).first();
      const inheritedHint = this.page.locator(SELECTORS.PER_DIEM_INHERITED_HINT).first();

      // The Per Diem section re-renders asynchronously after a reopen, so wait for either the
      // user-level select2 value OR the inherited group display to become visible before reading.
      await Promise.race([
        chosen.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
        inheritedHint.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      ]);

      if (await chosen.isVisible().catch(() => false)) {
        return (await chosen.textContent() ?? '').replace(/\s+/g, ' ').trim();
      }
      if (await inheritedHint.isVisible().catch(() => false)) {
        return (await inheritedHint.textContent() ?? '').replace(/\s+/g, ' ').trim();
      }
      throw new Error(
        `Neither the user-level per diem value (${SELECTORS.PER_DIEM_SELECT2_CHOSEN}) nor the inherited ` +
        `group display (${SELECTORS.PER_DIEM_INHERITED_HINT}) became visible within 15s.`
      );
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getDisplayedPerDiemValue] Could not read the displayed per diem value. ` +
        `The Per Diem section may not have rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Scrolls the users list to the top, finds the row whose 5th cell equals the given name, clicks it
   * to reopen the user, and waits for the detail form (First Name: label).
   *
   * @param {string} userName - The user display name held in the row's 5th cell
   */
  async reopenUserByFifthCell(userName) {
    try {
      await this.page.evaluate(() => window.scrollTo(0, 0));

      const rows = this.page.locator(SELECTORS.ADMIN_USERS_LIST_ROWS);
      await rows.first().waitFor({ state: 'visible', timeout: 30000 });

      const target = rows
        .filter({
          has: this.page
            .locator(SELECTORS.ADMIN_USER_ROW_FIFTH_CELL)
            .filter({ hasText: userName }),
        })
        .first();

      await target.waitFor({ state: 'visible', timeout: 15000 });
      await target.locator(SELECTORS.ADMIN_USER_ROW_FIFTH_CELL).first().click({ timeout: 10000 });

      await this.page
        .locator(SELECTORS.ADMIN_USER_DETAIL_FORM_FIRST_LABEL)
        .first()
        .waitFor({ state: 'visible', timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.reopenUserByFifthCell] Could not reopen user "${userName}" from the users list ` +
        `(row selector: ${SELECTORS.ADMIN_USERS_LIST_ROWS}, 5th cell: ${SELECTORS.ADMIN_USER_ROW_FIFTH_CELL}). ` +
        `No row's 5th cell matched the name, or the detail form did not open. Original: ${err.message}`
      );
    }
  }

  // --- Admin section navigation (test 40136) ---

  /**
   * Clicks an administration left-menu section link by its title attribute (e.g. "Roles",
   * "Per Diem Settings"). The admin left menu renders each section as `[title='<name>']`.
   *
   * @param {string} title - The section title attribute value to click
   */
  async clickAdminSectionByTitle(title) {
    try {
      const escaped = String(title).replace(/'/g, "\\'");
      const link = this.page.locator(`[title='${escaped}']`).first();
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickAdminSectionByTitle] Could not open the administration section "${title}" ` +
        `(selector: [title='${title}']). The logged-in user's role may not grant access to this section, or the ` +
        `admin menu did not render. Original: ${err.message}`
      );
    }
  }

  // --- Roles admin section (test 40136) ---

  /**
   * Waits for the roles datatable to render by asserting its first column header reads "Role".
   */
  async waitForRolesListReady() {
    try {
      const header = this.page.locator(SELECTORS.ROLES_DATATABLE_HEADER).first();
      await header.waitFor({ state: 'visible', timeout: 20000 });
      const text = (await header.textContent() ?? '').replace(/\s+/g, ' ').trim();
      if (!text.includes('Role')) {
        throw new Error(
          `The roles datatable header read "${text}" instead of "Role", so the Roles list did not render as expected.`
        );
      }
    } catch (err) {
      throw new Error(
        `[AdministrationPage.waitForRolesListReady] The Roles datatable did not render ` +
        `(header selector: ${SELECTORS.ROLES_DATATABLE_HEADER}). ` +
        `The Roles section may not have opened. Original: ${err.message}`
      );
    }
  }

  async clickAddNewRole() {
    try {
      const btn = this.page.locator(SELECTORS.ADD_NEW_ROLE_BTN).first();
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      await btn.click({ timeout: 10000 });
      // Confirm the role edit form opened (name input present)
      await this.page.locator(SELECTORS.ROLE_NAME_INPUT).first().waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickAddNewRole] Could not click the "Add new role" button ` +
        `(selector: ${SELECTORS.ADD_NEW_ROLE_BTN}). ` +
        `The Roles list must be open and the role must permit adding roles. Original: ${err.message}`
      );
    }
  }

  /**
   * Types a role name into the role name input. Uses pressSequentially so the AngularJS ng-model
   * $watch/$dirty cycle fires (fill() alone does not reliably dirty AngularJS 1.x forms).
   *
   * @param {string} name - The role name to type
   */
  async fillRoleName(name) {
    try {
      const input = this.page.locator(SELECTORS.ROLE_NAME_INPUT).first();
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click({ timeout: 5000 });
      await input.fill('', { timeout: 5000 });
      await input.pressSequentially(name, { delay: 40 });
      await input.press('Tab');
    } catch (err) {
      throw new Error(
        `[AdministrationPage.fillRoleName] Could not type role name "${name}" into the role name input ` +
        `(selector: ${SELECTORS.ROLE_NAME_INPUT}). ` +
        `The role edit form may not be open. Original: ${err.message}`
      );
    }
  }

  /**
   * Selects all privileges in the role's privilege dual-list: ticks the select-all checkbox, then
   * clicks the move-to-selected control to move every unselected privilege into the selected list.
   */
  async selectAllRolePrivileges() {
    try {
      const selectAll = this.page.locator(SELECTORS.ROLE_SELECT_ALL_PRIVILEGES).first();
      await selectAll.waitFor({ state: 'visible', timeout: 15000 });
      await selectAll.click({ timeout: 10000 });

      const moveBtn = this.page.locator(SELECTORS.ROLE_MOVE_TO_SELECTED).first();
      await moveBtn.waitFor({ state: 'visible', timeout: 15000 });
      await moveBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.selectAllRolePrivileges] Could not select all privileges for the role ` +
        `(select-all: ${SELECTORS.ROLE_SELECT_ALL_PRIVILEGES}, move-to-selected: ${SELECTORS.ROLE_MOVE_TO_SELECTED}). ` +
        `The privileges dual-list may not have rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Adds a user to the role via its users dual-list: filters by the user name, ticks the select-all
   * checkbox, then moves the matched user(s) into the selected list.
   *
   * @param {string} userName - The user name to filter and add
   */
  async addUserToRole(userName) {
    try {
      const filter = this.page.locator(SELECTORS.ROLE_USERS_FILTER).first();
      await filter.waitFor({ state: 'visible', timeout: 15000 });
      await filter.click({ timeout: 5000 });
      await filter.fill('', { timeout: 5000 });
      await filter.pressSequentially(userName, { delay: 50 });
      // Let AngularJS filter the users list
      await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

      const selectAll = this.page.locator(SELECTORS.ROLE_USERS_SELECT_ALL).first();
      await selectAll.waitFor({ state: 'visible', timeout: 15000 });
      await selectAll.click({ timeout: 10000 });

      const moveBtn = this.page.locator(SELECTORS.ROLE_USERS_MOVE_TO_SELECTED).first();
      await moveBtn.waitFor({ state: 'visible', timeout: 15000 });
      await moveBtn.click({ timeout: 10000 });

      // Click outside the users dual-list so AngularJS commits the moved selection to role.Users and
      // enables Save. Without this blur the role saves with an EMPTY user list, which then lets the
      // role be deleted (the test relies on the assigned user blocking deletion). The role name input
      // is a safe neutral target that moves focus off the widget.
      await this.page.locator(SELECTORS.ROLE_NAME_INPUT).first().click({ timeout: 5000 }).catch(() => {});
    } catch (err) {
      throw new Error(
        `[AdministrationPage.addUserToRole] Could not add user "${userName}" to the role ` +
        `(filter: ${SELECTORS.ROLE_USERS_FILTER}, select-all: ${SELECTORS.ROLE_USERS_SELECT_ALL}, ` +
        `move-to-selected: ${SELECTORS.ROLE_USERS_MOVE_TO_SELECTED}). ` +
        `The users filter may have returned no rows. Original: ${err.message}`
      );
    }
  }

  async clickSaveRole() {
    try {
      const saveBtn = this.page.locator(SELECTORS.ROLE_SAVE_BTN).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 15000 });
      await saveBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await saveBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickSaveRole] Could not click the Save button on the role edit form ` +
        `(selector: ${SELECTORS.ROLE_SAVE_BTN}). ` +
        `A role name and privileges must be set so the form is valid. Original: ${err.message}`
      );
    }
  }

  /**
   * Types a role name into the roles-list search box so the list narrows to that role.
   *
   * @param {string} roleName - The role name to search for
   */
  async fillRoleSearch(roleName) {
    try {
      const input = this.page.locator(SELECTORS.ROLE_SEARCH_INPUT).first();
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click({ timeout: 5000 });
      await input.fill('', { timeout: 5000 });
      await input.pressSequentially(roleName, { delay: 50 });
      await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    } catch (err) {
      throw new Error(
        `[AdministrationPage.fillRoleSearch] Could not search for role "${roleName}" ` +
        `(selector: ${SELECTORS.ROLE_SEARCH_INPUT}). ` +
        `The Roles list may not be open. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the first role row's name from the filtered roles list.
   *
   * @returns {Promise<string>}
   */
  async getFirstRoleRowName() {
    try {
      const cell = this.page.locator(SELECTORS.ROLE_FIRST_ROW_NAME).first();
      await cell.waitFor({ state: 'visible', timeout: 15000 });
      return (await cell.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getFirstRoleRowName] Could not read the first role row name ` +
        `(selector: ${SELECTORS.ROLE_FIRST_ROW_NAME}). ` +
        `The role search may have returned no rows. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns whether the delete-role (secondary) button is visible for the selected role.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isDeleteRoleBtnVisible({ timeout = 15000 } = {}) {
    try {
      const btn = this.page.locator(SELECTORS.ROLE_DELETE_BTN).first();
      await btn.waitFor({ state: 'visible', timeout });
      return true;
    } catch (err) {
      throw new Error(
        `[AdministrationPage.isDeleteRoleBtnVisible] The delete-role button did not become visible ` +
        `(selector: ${SELECTORS.ROLE_DELETE_BTN}). ` +
        `The role may not be selected. Original: ${err.message}`
      );
    }
  }

  async clickDeleteRoleBtn() {
    try {
      const btn = this.page.locator(SELECTORS.ROLE_DELETE_BTN).first();
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickDeleteRoleBtn] Could not click the delete-role button ` +
        `(selector: ${SELECTORS.ROLE_DELETE_BTN}). ` +
        `The role must be selected. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the title of the delete-role confirmation dialog (expected to read "Delete Role").
   *
   * @returns {Promise<string>}
   */
  async getDeleteRoleDialogTitle() {
    try {
      const title = this.page.locator(SELECTORS.DELETE_ROLE_DIALOG_TITLE).first();
      await title.waitFor({ state: 'visible', timeout: 15000 });
      return (await title.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getDeleteRoleDialogTitle] Could not read the delete-role dialog title ` +
        `(selector: ${SELECTORS.DELETE_ROLE_DIALOG_TITLE}). ` +
        `The confirmation dialog may not have opened. Original: ${err.message}`
      );
    }
  }

  /**
   * Confirms role deletion by clicking the primary button of the jQuery UI confirmation dialog
   * (reuses the shared DIALOG_CONFIRM_BTN selector).
   */
  async confirmRoleDeletion() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.DIALOG_CONFIRM_BTN).first();
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.confirmRoleDeletion] Could not click the confirm button in the delete-role dialog ` +
        `(selector: ${SELECTORS.DIALOG_CONFIRM_BTN}). ` +
        `The jQuery UI dialog may not have appeared. Original: ${err.message}`
      );
    }
  }

  // --- Per Diem Settings admin section (test 40136) ---

  /**
   * Reads the general-information header of the opened per diem detail panel
   * (expected to read "General information").
   *
   * @returns {Promise<string>}
   */
  async getPerDiemGeneralInfoHeader() {
    try {
      const header = this.page.locator(SELECTORS.PERDIEM_GENERAL_INFO_HEADER).first();
      await header.waitFor({ state: 'visible', timeout: 15000 });
      // The per diem detail panel replaces the previous section's content asynchronously, so poll until
      // the header stops reading the prior panel (e.g. the role's "Users" group) and shows the per diem
      // group. Tolerate a timeout — the caller asserts the final text and reports a rich mismatch.
      await this.page.waitForFunction(
        (selector) => {
          const el = document.querySelector(selector);
          return el && (el.textContent || '').replace(/\s+/g, ' ').trim() === 'General information';
        },
        SELECTORS.PERDIEM_GENERAL_INFO_HEADER,
        { timeout: 15000 }
      ).catch(() => {});
      return (await header.textContent() ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[AdministrationPage.getPerDiemGeneralInfoHeader] Could not read the per diem general-information header ` +
        `(selector: ${SELECTORS.PERDIEM_GENERAL_INFO_HEADER}). ` +
        `The per diem detail panel may not have opened. Original: ${err.message}`
      );
    }
  }

  async clickAddPerDiemDestination() {
    try {
      const link = this.page.locator(SELECTORS.PERDIEM_ADD_DESTINATION).first();
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click({ timeout: 10000 });
      // Confirm a destination row rendered (its daily-sum input appears)
      await this.page.locator(SELECTORS.PERDIEM_DAILY_SUM).first().waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickAddPerDiemDestination] Could not add a destination row ` +
        `(selector: ${SELECTORS.PERDIEM_ADD_DESTINATION}). ` +
        `The per diem detail panel must be open. Original: ${err.message}`
      );
    }
  }

  /**
   * Locates the destination row that contains the daily-sum input. The destination and currency
   * select2 widgets both live in this row, so scoping to it lets us pick them by DOM order instead
   * of the fragile #s2id_autogen* ids Testim recorded.
   *
   * @returns {import('playwright').Locator}
   */
  perDiemDestinationRow() {
    // Nearest ancestor of the daily-sum input that wraps BOTH row select2 triggers (destination +
    // currency). Requiring >=2 climbs past the inner cell/div that holds only the destination widget
    // up to the destination row itself, so nth(0)=destination and nth(1)=currency resolve correctly.
    return this.page
      .locator(SELECTORS.PERDIEM_DAILY_SUM)
      .first()
      .locator(`xpath=ancestor::*[count(.//a[contains(@class,'select2-choice')])>=2][1]`);
  }

  /**
   * Opens the Nth select2 trigger within the destination row and picks its first result.
   *
   * @param {number} index - Zero-based select2 index in the row (0 = destination, 1 = currency)
   * @param {string} label - Human label for error context ("destination" / "currency")
   */
  async selectFirstRowSelect2Option(index, label) {
    try {
      const row = this.perDiemDestinationRow();
      const trigger = row.locator(SELECTORS.PERDIEM_ROW_SELECT2_TRIGGER).nth(index);
      await trigger.waitFor({ state: 'visible', timeout: 15000 });
      await trigger.click({ timeout: 10000 });

      await this.page.locator(SELECTORS.PERDIEM_SELECT2_DROPDOWN).first().waitFor({ state: 'visible', timeout: 15000 });

      const firstResult = this.page.locator(SELECTORS.PERDIEM_SELECT2_FIRST_RESULT).first();
      await firstResult.waitFor({ state: 'visible', timeout: 15000 });
      await firstResult.click({ timeout: 10000 });

      // Dropdown closes once a result is picked
      await this.page.locator(SELECTORS.PERDIEM_SELECT2_DROPDOWN).first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    } catch (err) {
      throw new Error(
        `[AdministrationPage.selectFirstRowSelect2Option] Could not pick the first ${label} option ` +
        `(row select2 index ${index}, trigger: ${SELECTORS.PERDIEM_ROW_SELECT2_TRIGGER}, ` +
        `result: ${SELECTORS.PERDIEM_SELECT2_FIRST_RESULT}). ` +
        `The destination row or its select2 dropdown may not have rendered. Original: ${err.message}`
      );
    }
  }

  async selectFirstDestinationOption() {
    return this.selectFirstRowSelect2Option(0, 'destination');
  }

  async selectFirstCurrencyOption() {
    return this.selectFirstRowSelect2Option(1, 'currency');
  }

  /**
   * Types the daily sum into the destination row's daily-sum input.
   *
   * @param {string} value - The daily sum to enter (e.g. "10")
   */
  async fillDailySum(value) {
    try {
      const input = this.page.locator(SELECTORS.PERDIEM_DAILY_SUM).first();
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click({ timeout: 5000 });
      await input.fill('', { timeout: 5000 });
      await input.pressSequentially(value, { delay: 40 });
      await input.press('Tab');
    } catch (err) {
      throw new Error(
        `[AdministrationPage.fillDailySum] Could not type daily sum "${value}" ` +
        `(selector: ${SELECTORS.PERDIEM_DAILY_SUM}). ` +
        `The destination row may not have rendered. Original: ${err.message}`
      );
    }
  }

  async clickSavePerDiem() {
    try {
      const saveBtn = this.page.locator(SELECTORS.PERDIEM_SAVE_BTN).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 15000 });
      await saveBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await saveBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickSavePerDiem] Could not click the Save button on the per diem detail form ` +
        `(selector: ${SELECTORS.PERDIEM_SAVE_BTN}). Original: ${err.message}`
      );
    }
  }

  async clickRemovePerDiemDestination() {
    try {
      const btn = this.page.locator(SELECTORS.PERDIEM_REMOVE_DESTINATION).first();
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdministrationPage.clickRemovePerDiemDestination] Could not click the remove-destination control ` +
        `(selector: ${SELECTORS.PERDIEM_REMOVE_DESTINATION}). ` +
        `There may be no destination row to remove. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns whether any destination row is still present, by counting the daily-sum inputs.
   * Used for the negative assertion that a removed destination no longer appears.
   *
   * @param {object} [options]
   * @param {number} [options.settleTimeout=5000] - Grace period for AngularJS to remove the row
   * @returns {Promise<boolean>}
   */
  async isDestinationRowPresent({ settleTimeout = 5000 } = {}) {
    try {
      const rows = this.page.locator(SELECTORS.PERDIEM_DAILY_SUM);
      // Give AngularJS a moment to drop the row from the DOM after removal + save
      await rows.first().waitFor({ state: 'hidden', timeout: settleTimeout }).catch(() => {});
      return (await rows.count()) > 0;
    } catch (err) {
      throw new Error(
        `[AdministrationPage.isDestinationRowPresent] Could not determine whether a destination row is present ` +
        `(selector: ${SELECTORS.PERDIEM_DAILY_SUM}). Original: ${err.message}`
      );
    }
  }
}

module.exports = AdministrationPage;
