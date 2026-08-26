/**
 * Page Object for the Manage profiles list (/manage-profiles).
 *
 * Reached from the header avatar menu's permission-gated "Manage profiles" entry, which
 * app-profile-menu.ts opens with openInNewTab — so this page object is always constructed
 * against the NEW tab, never the tab the menu was clicked in.
 *
 * Contains only UI-level interactions: locators, atomic actions and reads. No assertions,
 * no business logic — those live in the ManageProfiles DSL.
 */

const SELECTORS = {
  // manage-profiles.vue root section + its centred <h1>. The heading text is i18n
  // ('userProfile.manageProfiles'), so anchor on structure rather than on the string.
  ROOT: ".manage-profiles",
  TITLE: ".manage-profiles .manage-profiles-title h1",

  // "Showing X of Y profiles" counter, left of the search box in .actions-container.
  PROFILES_COUNT: ".manage-profiles .profiles-count",
  SEARCH_INPUT: "[data-testid=\"manage-profiles.search\"] input",

  // Sortable column headers. Rendered only on desktop (v-if="!isMobile"), which is the
  // viewport the suite runs at.
  SORT_HEADER_USER: "[data-testid=\"manage-profiles.sort-user\"]",
  SORT_HEADER_EMAIL: "[data-testid=\"manage-profiles.sort-email\"]",
  SORT_HEADER_USER_GROUP: "[data-testid=\"manage-profiles.sort-userGroup\"]",

  // One row per profile on the current page of the list.
  PROFILE_ROW: ".manage-profiles .profile-row",
  // Desktop row layout is three .app-column.is-3 cells: user / email / user group.
  ROW_NAME: ".app-column.is-3:nth-child(1) p",
  ROW_EMAIL: ".app-column.is-3:nth-child(2) p",

  // The pencil. Its data-testid carries the profile id, so it is matched by prefix and
  // scoped to a row rather than looked up globally.
  // manage-profiles.scss keeps .edit-btn at opacity 0 until the row is hovered (or the
  // button is focus-visible), so it is present in the DOM but not "visible" to a user
  // before the hover — hence the opacity read in isEditIconRevealedOnRow below.
  ROW_EDIT_BUTTON: "[data-testid^=\"manage-profiles.edit-\"]",
  // Swapped in for the pencil while the profile is being fetched (openingProfileId).
  ROW_EDIT_LOADER: "[data-testid^=\"manage-profiles.edit-loading-\"]",
};

class ManageProfilesPage {
  constructor(page) {
    this.page = page;
  }

  // --- Waits ---

  /**
   * Waits for the list to finish loading: the page shell, then at least one profile row.
   * The rows are behind an isLoading spinner, so the row wait is what proves the fetch
   * resolved — not just that the route rendered.
   *
   * @param {number} [timeout=30000]
   */
  async waitForList(timeout = 30000) {
    try {
      await this.page.locator(SELECTORS.ROOT).waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[ManageProfilesPage.waitForList] The Manage profiles page did not render (selector: ${SELECTORS.ROOT}). ` +
        "The new tab may have opened on a different route, or the \"Manage profiles\" feature flag " +
        `(IS_MANAGE_PROFILES_ENABLED) is off for this corporation. Original: ${err.message}`,
      );
    }

    try {
      await this.page.locator(SELECTORS.PROFILE_ROW).first().waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[ManageProfilesPage.waitForList] The Manage profiles page rendered but no profile row appeared " +
        `(selector: ${SELECTORS.PROFILE_ROW}). The list may still be loading, or this user can see no ` +
        `other profiles. Original: ${err.message}`,
      );
    }
  }

  // --- Reads ---

  /** @returns {Promise<string>} The page heading text, whitespace-normalized. */
  async getTitleText() {
    const title = this.page.locator(SELECTORS.TITLE).first();
    try {
      await title.waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        "[ManageProfilesPage.getTitleText] The Manage profiles heading never became visible " +
        `(selector: ${SELECTORS.TITLE}). Original: ${err.message}`,
      );
    }
    return ((await title.textContent()) || "").replace(/\s+/g, " ").trim();
  }

  /**
   * @returns {Promise<string>} The "Showing X of Y profiles" counter, whitespace-normalized.
   *   The markup splits it across several spans, so the raw text carries newlines.
   */
  async getProfilesCountText() {
    const counter = this.page.locator(SELECTORS.PROFILES_COUNT).first();
    try {
      await counter.waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        "[ManageProfilesPage.getProfilesCountText] The profiles counter never became visible " +
        `(selector: ${SELECTORS.PROFILES_COUNT}). Original: ${err.message}`,
      );
    }
    return ((await counter.textContent()) || "").replace(/\s+/g, " ").trim();
  }

  /** @returns {Promise<number>} How many profile rows the current page of the list shows. */
  async getRowCount() {
    return this.page.locator(SELECTORS.PROFILE_ROW).count();
  }

  /** @returns {Promise<boolean>} Whether the search box is rendered. */
  async isSearchBoxVisible() {
    return this.page.locator(SELECTORS.SEARCH_INPUT).first().isVisible();
  }

  /**
   * @returns {Promise<{user: boolean, email: boolean, userGroup: boolean}>} Which of the three
   *   desktop column headers are rendered.
   */
  async getColumnHeaderVisibility() {
    const [user, email, userGroup] = await Promise.all([
      this.page.locator(SELECTORS.SORT_HEADER_USER).first().isVisible(),
      this.page.locator(SELECTORS.SORT_HEADER_EMAIL).first().isVisible(),
      this.page.locator(SELECTORS.SORT_HEADER_USER_GROUP).first().isVisible(),
    ]);
    return { user, email, userGroup };
  }

  /**
   * @param {number} index Zero-based row index within the current page of the list.
   * @returns {Promise<string>} That row's full name, whitespace-normalized.
   */
  async getRowFullName(index) {
    const name = this._row(index).locator(SELECTORS.ROW_NAME).first();
    try {
      await name.waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManageProfilesPage.getRowFullName] Could not read the name on profile row ${index} ` +
        `(selector: ${SELECTORS.ROW_NAME}). Original: ${err.message}`,
      );
    }
    return ((await name.textContent()) || "").replace(/\s+/g, " ").trim();
  }

  // --- Actions ---

  /**
   * Hovers a profile row so its pencil fades in.
   *
   * @param {number} index Zero-based row index.
   */
  async hoverRow(index) {
    const row = this._row(index);
    try {
      await row.waitFor({ state: "visible", timeout: 15000 });
      await row.scrollIntoViewIfNeeded();
      await row.hover({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManageProfilesPage.hoverRow] Could not hover profile row ${index} ` +
        `(selector: ${SELECTORS.PROFILE_ROW}). The list may hold fewer rows than expected. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Reports whether a row's pencil is actually revealed to the user.
   *
   * Playwright's isVisible() is not enough on its own here: .edit-btn is always in the DOM
   * and laid out, and is only hidden by `opacity: 0` until the row is hovered — which
   * isVisible() still reports as visible. The computed opacity is what separates a revealed
   * pencil from a hidden one, so it is read explicitly.
   *
   * @param {number} index Zero-based row index.
   * @returns {Promise<boolean>} True when the pencil is rendered AND fully opaque.
   */
  async isEditIconRevealedOnRow(index) {
    const button = this._row(index).locator(SELECTORS.ROW_EDIT_BUTTON).first();

    if ((await button.count()) === 0 || !(await button.isVisible())) {
      return false;
    }

    const opacity = await button.evaluate((el) => window.getComputedStyle(el).opacity);
    return Number.parseFloat(opacity) === 1;
  }

  /**
   * Clicks a row's pencil, which loads that profile and opens the user-profile dialog.
   *
   * @param {number} index Zero-based row index.
   */
  async clickEditOnRow(index) {
    const button = this._row(index).locator(SELECTORS.ROW_EDIT_BUTTON).first();
    try {
      await button.waitFor({ state: "visible", timeout: 15000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManageProfilesPage.clickEditOnRow] Could not click the edit icon on profile row ${index} ` +
        `(selector: ${SELECTORS.ROW_EDIT_BUTTON}). The row may not be hovered — the pencil is ` +
        `opacity:0 until then. Original: ${err.message}`,
      );
    }
  }

  /**
   * Waits for the per-row loading spinner that replaces the pencil during the profile fetch
   * to disappear. Never fails: the request can resolve before the spinner is ever observed.
   *
   * @param {number} index Zero-based row index.
   * @param {number} [timeout=30000]
   */
  async waitForEditLoaderToClear(index, timeout = 30000) {
    await this._row(index)
      .locator(SELECTORS.ROW_EDIT_LOADER)
      .first()
      .waitFor({ state: "hidden", timeout })
      .catch(() => {});
  }

  // --- Internals ---

  /**
   * @param {number} index Zero-based row index.
   * @returns {import("@playwright/test").Locator}
   */
  _row(index) {
    return this.page.locator(SELECTORS.PROFILE_ROW).nth(index);
  }
}

module.exports = ManageProfilesPage;
