const SELECTORS = {
  // OBT side-nav — admin settings icon (material icon text is "settings")
  ADMIN_SETTINGS_ICON: '.app-side-nav .material-symbols-outlined',

  // Administration app (AngularJS) — page-ready indicator
  SETTINGS_FORM: "[name='settingsForm']",

  // Navigation tabs inside the admin app
  USERS_TAB: "[title='Users']",

  // User search input (AngularJS ng-disabled attribute identifies it)
  USER_SEARCH_INPUT: "[ng-disabled='isDisabled']",

  // User row in the results list — each row has columns; 3rd column (name cell) is the click target
  USER_ROW_NAME_CELL: "[data-ng-repeat*='user in users'] > :nth-child(3)",

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
};

class AdminPage {
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
        `[AdminPage.clickAdminSettingsIcon] Could not click the admin settings icon in the side nav ` +
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
      await this.page.locator(SELECTORS.SETTINGS_FORM).waitFor({ state: 'attached', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[AdminPage.waitForAdminPageReady] Administration page did not finish loading ` +
        `(selector: ${SELECTORS.SETTINGS_FORM}). ` +
        `The admin settings URL may be incorrect or the user lacks admin privileges. ` +
        `Original: ${err.message}`
      );
    }
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
        .waitFor({ state: 'visible', timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[AdminPage.clickUsersTab] Could not navigate to the Users list in the administration. ` +
        `The admin URL may not contain a Corporation ID, or the user list did not render. ` +
        `Original: ${err.message}`
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
    } catch (err) {
      throw new Error(
        `[AdminPage.fillUserSearch] Could not type "${userName}" into the user search input ` +
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
      await nameCell.waitFor({ state: 'visible', timeout: 20000 });
      await nameCell.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[AdminPage.clickFirstUserRowWithName] Could not click first user name cell after searching for "${userName}" ` +
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
        `[AdminPage.waitForUserRecord] User record for "${firstName}" did not load ` +
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
        `[AdminPage.clickFopTab] Could not click the Form of Payment tab in the admin user view ` +
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
        `[AdminPage.clickCreditCardRow] Could not find and click credit card row for "${cardName}" ` +
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
        `[AdminPage.getExpiryMonth] Could not read expiry month from Select2 dropdown ` +
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
        `[AdminPage.getExpiryYear] Could not read expiry year from Select2 dropdown ` +
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
        `[AdminPage.clickDeleteImageForCard] Could not click delete image for card "${cardName}" ` +
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
        `[AdminPage.confirmDeleteDialog] Could not click the confirm button in the delete dialog ` +
        `(selector: ${SELECTORS.DIALOG_CONFIRM_BTN}). ` +
        `The jQuery UI dialog may not have appeared. Original: ${err.message}`
      );
    }
  }
}

module.exports = AdminPage;
