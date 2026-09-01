/**
 * Page Object for menu page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  BOOK_NEW_TRIP_ICON: ".top-container > :nth-child(4) .material-symbols-outlined",
  // Header profile avatar (app-header.vue): always visible immediately after login, with no click
  // needed to reveal it — used as the "are we logged in" signal instead of the logout button itself,
  // which as of app v2.13 lives inside this avatar's dropdown (see LOGOUT_ICON below) and would
  // require opening that dropdown just to prove login succeeded.
  //
  // Matches EITHER header shape, because staging serves both and has been observed switching
  // between them mid-session (2026-08-19: passing runs at 09:33/09:38, then `.avatar-trigger`
  // absent from 09:43 — same code, same user):
  //   * `.avatar-trigger`   — the v2.13 dropdown-style profile menu;
  //   * `.passenger-avatar` — app-avatar.vue's avatar, with logout as a sibling `.logout-icon`.
  // Login confirmation is on the critical path of every scenario in the suite, so it must not be
  // pinned to whichever of the two happens to be deployed. Resolve with .first() — a union selector
  // would otherwise trip Playwright strict mode if a build ever rendered both.
  AVATAR_TRIGGER: ".app-profile-menu .avatar-trigger, .app-profile-menu .passenger-avatar",
  // Log out button. Previously a standalone header icon (`.logout-icon`); app v2.13 moved it into a
  // dropdown revealed by clicking AVATAR_TRIGGER (profile-menu.vue renders it as a
  // `.profile-menu-item.logout-item` button, teleported into an `.el-popper` on click/open).
  // Leads with the component's data-testid, keeping the class as a fallback for deployments that
  // predate it. Single source of truth for this button: ProfilePage reads it from here for the
  // profile-menu option assertions instead of holding a second copy.
  LOGOUT_ICON: "[data-testid=\"profile-menu.logout\"], .profile-menu-item.logout-item",
  TRIPS_ICON: "a[href=\"/trips\"]",
  // Language switcher (app-header.vue): hovering it reveals a tooltip listing each enabled
  // language as a ".language-item" row labelled by name.
  //
  // Matches EITHER shape the header renders, because the trigger depends on account state
  // (`v-if="!languageIcon"` / `v-else`, AB#83148):
  //   * `.support-icon`     — the material-symbols globe, shown until a display language has been
  //                           explicitly selected (or when that language has no flag mapping);
  //   * `.header-lang-flag` — the app-img flag of the active display language, shown afterwards.
  // The display language is persisted on the user profile, so any user who has ever switched keeps
  // the flag on every later run — pinning this to the globe made 33152 fail on its own second run.
  // Resolve with .first(): the two are mutually exclusive, and .first() keeps a hypothetical build
  // rendering both from tripping Playwright strict mode.
  LANGUAGE_ICON: ".support-icon, .header-lang-flag",
  LANGUAGE_ITEM: ".language-item",
  // Corporate expenses entry in the LEFT side-nav (app-side-nav.vue): a clickable
  // ".icon-container" div labelled "<expenseDisplayName> - Expenses" whose only glyph is the
  // material-symbols "account_balance_wallet" icon. Anchored on that glyph because the component
  // declares no data-testid, and positional selectors (":nth-child(N)") must NOT be used here —
  // the sibling nav entries are v-if gated by permissions, so the index shifts per user.
  EXPENSES_NAV_ITEM:
    '.app-side-nav .top-container .icon-container:has(.material-symbols-outlined:text-is("account_balance_wallet"))',
};

class MenuPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "Book a New Trip" icon element.
   * @returns {import('@playwright/test').Locator}
   */
  getBookANewTripIcon() {
    return this.page.locator(SELECTORS.BOOK_NEW_TRIP_ICON);
  }

  /**
   * Gets the logout icon element.
   * @returns {import('@playwright/test').Locator}
   */
  getLogoutIcon() {
    return this.page.locator(SELECTORS.LOGOUT_ICON);
  }

  /**
   * Gets the Trips navigation link element.
   * @returns {import('@playwright/test').Locator}
   */
  getTripsLink() {
    return this.page.locator(SELECTORS.TRIPS_ICON);
  }

  /**
   * Waits for the "Book a New Trip" icon to appear.
   * Extra timeout for CI environments where rendering can be slower.
   */
  async waitForBookANewTripIcon() {
    // Extended timeout for CI environments
    await this.getBookANewTripIcon().waitFor({ state: "visible", timeout: 30000 });
  }

  /** Clicks "Book a New Trip" (this opens a new tab) */
  async clickBookANewTrip() {
    const icon = this.getBookANewTripIcon();
    
    // Ensure element is in viewport and ready
    await icon.scrollIntoViewIfNeeded();
    
    // Wait for element to be stable before clicking
    await icon.waitFor({ state: "visible", timeout: 10000 });
    await icon.waitFor({ state: "attached", timeout: 10000 });
    
    // Click with extended timeout for CI environments
    await icon.click({ timeout: 15000 });
  }

  /**
   * Waits for the header profile avatar to be visible.
   * Used as confirmation that the user is logged in. Checks the avatar trigger rather than the
   * logout button itself (see LOGOUT_ICON) — the avatar is visible immediately post-login with no
   * click required, so this stays a passive "did we land on the logged-in header" check.
   */
  async waitForLogoutIcon() {
    await this.page
      .locator(SELECTORS.AVATAR_TRIGGER)
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
  }

  /** Opens the profile avatar dropdown and clicks "Log out" inside it. */
  async clickLogout() {
    await this.page.locator(SELECTORS.AVATAR_TRIGGER).first().click();
    const logoutButton = this.getLogoutIcon();
    await logoutButton.waitFor({ state: "visible", timeout: 10000 });
    await logoutButton.click();
  }

  /** Opens the Trips page */
  async clickTrips() {
    const tripsLink = this.getTripsLink();
    await tripsLink.waitFor({ state: "visible", timeout: 10000 });
    // Use force click to bypass any overlay issues
    await tripsLink.click({ force: true });
  }

  /**
   * Hovers the header language switcher (globe icon, or the active language's flag) to reveal
   * the language list tooltip.
   */
  async hoverLanguageIcon() {
    const icon = this.page.locator(SELECTORS.LANGUAGE_ICON).first();
    try {
      await icon.waitFor({ state: "visible", timeout: 10000 });
      await icon.hover();
    } catch (err) {
      throw new Error(`[MenuPage.hoverLanguageIcon] Could not hover the header language switcher (${SELECTORS.LANGUAGE_ICON}). It renders as the globe icon until a display language has been selected and as that language's flag afterwards; neither is rendered on mobile viewports. Original: ${err.message}`);
    }
  }

  /**
   * Selects a language from the hover tooltip by its visible name (e.g. "Italian", "English").
   * Matches the ".language-item" row by text rather than position, since the list of
   * enabled languages varies per corporation.
   * @param {string} languageName - The language name as shown in the list
   */
  async clickLanguageOption(languageName) {
    if (!languageName || typeof languageName !== "string") {
      throw new Error(`[MenuPage.clickLanguageOption] "languageName" must be a non-empty string, got: ${typeof languageName} (${JSON.stringify(languageName)})`);
    }

    const option = this.page.locator(SELECTORS.LANGUAGE_ITEM, { hasText: languageName }).first();
    try {
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(`[MenuPage.clickLanguageOption] Could not select language "${languageName}" from the language list (${SELECTORS.LANGUAGE_ITEM}). The language may not be enabled for this corporation or the tooltip closed before clicking. Original: ${err.message}`);
    }
  }

  /**
   * Gets the corporate expenses side-nav entry by its expense display name.
   * The row renders as "<expenseName> - Expenses", so a text filter on the display name
   * ("MESH") matches it and also disambiguates should a second wallet-glyph entry ever appear.
   * Works with the nav collapsed too — collapsing hides the label via overflow, not display:none.
   *
   * @param {string} expenseName - The corporate expense display name (e.g. "MESH")
   * @returns {import('@playwright/test').Locator}
   */
  getExpensesNavItem(expenseName) {
    return this.page.locator(SELECTORS.EXPENSES_NAV_ITEM).filter({ hasText: expenseName }).first();
  }

  /**
   * Clicks the corporate expenses side-nav entry, which signs the user in to the
   * configured expenses provider in a NEW browser tab.
   *
   * @param {string} expenseName - The corporate expense display name (e.g. "MESH")
   */
  async clickExpensesNavItem(expenseName) {
    if (!expenseName || typeof expenseName !== "string") {
      throw new Error(`[MenuPage.clickExpensesNavItem] "expenseName" must be a non-empty string, got: ${typeof expenseName} (${JSON.stringify(expenseName)})`);
    }

    const item = this.getExpensesNavItem(expenseName);
    try {
      // 30s (rather than the file's usual 15s) because this entry is rendered only after the
      // async user-expense lookup resolves — same reasoning as waitForBookANewTripIcon.
      await item.waitFor({ state: "visible", timeout: 30000 });
      await item.click({ timeout: 15000 });
    } catch (err) {
      throw new Error(`[MenuPage.clickExpensesNavItem] Could not click the "${expenseName} - Expenses" side-nav entry (${SELECTORS.EXPENSES_NAV_ITEM}). The entry is rendered only when BOTH an expense display name and an expense URL are returned by the async user-expense lookup (getUserExpense for the user's corporation), and only on desktop viewports — so "not found" can mean this user has no corporate expense provider configured rather than a broken selector. Original: ${err.message}`);
    }
  }
}

module.exports = { MenuPage, SELECTORS };
