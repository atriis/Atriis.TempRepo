/**
 * Page Object for the application homepage.
 * Contains only UI-level interactions with homepage widgets
 * (e.g. the upcoming-trips monitor panel).
 */

const SELECTORS = {
  // "All trips" button on the homepage upcoming-trips panel.
  // Mobile layout carries a stable data-testid; desktop renders the same
  // app-btn with no testid, so we fall back to the visible button text.
  // :visible on each branch avoids the hidden responsive-layout duplicate.
  ALL_TRIPS_BUTTON:
    '[data-testid="trip.home.all-trips-btn"]:visible, button.btn:has-text("All trips"):visible',
  // "Start New Trip" primary button shown on the homepage for low-product users (2 products or
  // fewer). The class .imt-btn is reused by other primary buttons (e.g. "Add me"), so callers must
  // filter by the "Start New Trip" text to target this one specifically.
  START_NEW_TRIP_BUTTON: '.imt-btn',

  // Homepage product carousel (product-carousel-home-page.vue). The bar shows the first five
  // bookable products as tiles; a "more" button holds the rest. No data-testid exists on any tile,
  // so tiles are matched by their visible .icon-text label.
  PRODUCT_CAROUSEL: '.product-carousel',
  PRODUCT_CAROUSEL_ITEM: '.product-carousel .carousel-item',
  PRODUCT_TILE_BUTTON: '.product-btn',
  // "more products" button (more_horiz icon) shown when the user has more than five products.
  MORE_PRODUCTS_BUTTON: '.product-carousel .more-btn',
  // Element Plus teleports el-dropdown menus (Rail sub-types, the "more" menu) to <body>;
  // scope to the visible one so a stale hidden popper is never matched.
  DROPDOWN_MENU: '.el-dropdown-menu:visible',
  // Element Plus renders <el-dropdown-item> as <li class="el-dropdown-menu__item"> (BEM double-underscore).
  DROPDOWN_MENU_ITEM: '.el-dropdown-menu:visible .el-dropdown-menu__item',
  // Side-nav "Home Page" link — its icon is the material-symbols "home" glyph (class trips-icon).
  HOME_NAV_LINK:
    '.app-side-nav a:has(.material-symbols-outlined.trips-icon), .app-side-nav a:has(.material-symbols-outlined:text-is("home"))',

  // Homepage trip-monitor panel (home-page.vue): an el-tabs listing the user's trips across
  // "My upcoming trips", "My bookings" and "Awaiting my approval". Only tabs with trips are shown.
  // The "My upcoming trips" tab header. el-tabs renders each pane's `name` as the item id, so the
  // upcoming pane (name "upcoming-trips") is #tab-upcoming-trips — locale-independent and consistent
  // with the #tab-<name> convention used for product tabs (see isProductTabActive).
  UPCOMING_TRIPS_TAB: '#tab-upcoming-trips',
  // A single trip card in the active tab's list (trip-list-home → trip-preview-home). Scoped to
  // .trip-tabs-container — the DESKTOP trip-monitor layout (mobile uses a tab-less .trips-mobile
  // stack); this suite runs desktop headless. :visible restricts the count to the active pane, as
  // el-tabs keeps inactive panes in the DOM but hidden.
  TRIP_CARD: '.trip-tabs-container .trip-list-home .trip-preview-home:visible',
};

/**
 * Homepage product catalogue.
 *
 * Maps each product's feature-file name to how it is identified in the UI:
 * - `label`     — the visible .icon-text on the carousel tile / more-menu item
 * - `tabId`     — the el-tabs item id on the trip search page, asserted active (ignored when urlContains is set)
 * - `isRail`    — Rail is itself an el-dropdown of sub-types (see product-carousel-home-page.vue)
 * - `urlContains` — Manual Quote opens a separate route instead of a trip tab, so it is asserted by URL
 *
 * Labels come from the Atriis.OBT i18n strings rendered in product-carousel-home-page.vue and the
 * trip search tabs in trip-index.vue.
 */
const PRODUCTS = {
  Flight: { label: "Flight", tabId: "tab-flight" },
  Hotel: { label: "Hotel", tabId: "tab-hotel" },
  Car: { label: "Car", tabId: "tab-car" },
  Rail: { label: "Rail", tabId: "tab-rails", isRail: true },
  Transport: { label: "Transport", tabId: "tab-groundService" },
  Parking: { label: "Parking", tabId: "tab-parking" },
  "Manual Quote": { label: "Manual quote", tabId: "tab-manual", urlContains: "manual-quote" },
};

class HomePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the "All trips" button on the homepage upcoming-trips panel,
   * which navigates the booker to the full Trips page.
   */
  async clickAllTripsButton() {
    const button = this.page.locator(SELECTORS.ALL_TRIPS_BUTTON).first();
    try {
      await button.waitFor({ state: "visible", timeout: 15000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[HomePage.clickAllTripsButton] Could not click the "All trips" button on the homepage upcoming-trips panel (${SELECTORS.ALL_TRIPS_BUTTON}). The panel may not have rendered or the account lacks an upcoming-trips widget. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns whether the "Start New Trip" button is visible on the homepage.
   * Filters the shared .imt-btn class by its "Start New Trip" text so it does not match other
   * primary buttons (e.g. "Add me").
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isStartNewTripButtonVisible(timeout = 15000) {
    const button = this.page
      .locator(SELECTORS.START_NEW_TRIP_BUTTON)
      .filter({ hasText: "Start New Trip" })
      .first();
    try {
      await button.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolves a product's UI configuration by its feature-file name.
   * @param {string} productName - e.g. "Flight", "Rail", "Manual Quote"
   * @returns {{label: string, tabId: string, isRail?: boolean, urlContains?: string}}
   */
  getProductConfig(productName) {
    const config = PRODUCTS[productName];
    if (!config) {
      throw new Error(
        `[HomePage.getProductConfig] Unknown product "${productName}". Valid products: ${Object.keys(PRODUCTS).join(", ")}.`
      );
    }
    return config;
  }

  /**
   * Locates a carousel tile by its visible label. The tile's .icon-text is matched exactly
   * (whitespace-normalised), so "Rail" matches the template's "Rail " and "Manual quote" matches
   * the capitalised-via-CSS label.
   * @param {string} label
   * @returns {import('@playwright/test').Locator}
   */
  getProductTileByLabel(label) {
    return this.page
      .locator(SELECTORS.PRODUCT_CAROUSEL_ITEM)
      .filter({ has: this.page.getByText(label, { exact: true }) });
  }

  /**
   * Returns whether the named product's tile is visible on the homepage carousel.
   * @param {string} productName
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isProductTileVisible(productName, timeout = 15000) {
    const { label } = this.getProductConfig(productName);
    const tile = this.getProductTileByLabel(label).first();
    try {
      await tile.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks a directly-visible product tile in the carousel (Flight, Hotel, Car, Transport, ...).
   * Not for Rail (a sub-type dropdown) or products behind the "more" menu.
   * @param {string} productName
   */
  async clickProductTile(productName) {
    const { label } = this.getProductConfig(productName);
    const button = this.getProductTileByLabel(label)
      .locator(SELECTORS.PRODUCT_TILE_BUTTON)
      .first();
    try {
      await button.waitFor({ state: "visible", timeout: 15000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[HomePage.clickProductTile] Could not click the "${label}" product tile on the homepage carousel ` +
          `(${SELECTORS.PRODUCT_CAROUSEL_ITEM} > ${SELECTORS.PRODUCT_TILE_BUTTON}). The tile may not be rendered ` +
          `for this user or is hidden behind the "more" menu. Original: ${err.message}`
      );
    }
  }

  /**
   * Opens the Rail product. The Rail tile is an el-dropdown (hover-triggered on desktop) that reveals
   * the available rail sub-types; the first sub-type is selected to reach a rail search page.
   */
  async openRailProduct() {
    const railButton = this.getProductTileByLabel(PRODUCTS.Rail.label)
      .locator(SELECTORS.PRODUCT_TILE_BUTTON)
      .first();
    try {
      await railButton.waitFor({ state: "visible", timeout: 15000 });
      await railButton.hover();
      const menu = this.page.locator(SELECTORS.DROPDOWN_MENU).first();
      try {
        await menu.waitFor({ state: "visible", timeout: 8000 });
      } catch {
        // Hover may not settle the popper in headless — click to toggle it open as a fallback.
        await railButton.click({ timeout: 10000 });
        await menu.waitFor({ state: "visible", timeout: 8000 });
      }
      const firstSubType = menu.locator(".el-dropdown-menu__item").first();
      await firstSubType.waitFor({ state: "visible", timeout: 10000 });
      await firstSubType.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[HomePage.openRailProduct] Could not open the Rail product and select a sub-type from its dropdown ` +
          `(${SELECTORS.DROPDOWN_MENU} .el-dropdown-menu__item). The Rail tile may not be present or offers no sub-types ` +
          `for this user. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns whether the "more products" (more_horiz) button is visible on the carousel.
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isMoreProductsButtonVisible(timeout = 15000) {
    const btn = this.page.locator(SELECTORS.MORE_PRODUCTS_BUTTON).first();
    try {
      await btn.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Opens the "more products" dropdown (hover-triggered on desktop, click fallback for headless).
   */
  async openMoreProductsMenu() {
    const moreBtn = this.page.locator(SELECTORS.MORE_PRODUCTS_BUTTON).first();
    try {
      await moreBtn.waitFor({ state: "visible", timeout: 15000 });
      await moreBtn.hover();
      const menu = this.page.locator(SELECTORS.DROPDOWN_MENU).first();
      try {
        await menu.waitFor({ state: "visible", timeout: 8000 });
      } catch {
        await moreBtn.click({ timeout: 10000 });
        await menu.waitFor({ state: "visible", timeout: 8000 });
      }
    } catch (err) {
      throw new Error(
        `[HomePage.openMoreProductsMenu] Could not open the "more products" menu (${SELECTORS.MORE_PRODUCTS_BUTTON}). ` +
          `The button may not be present for this user. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks a product entry inside the open "more products" dropdown menu.
   * The menu must already be open (see openMoreProductsMenu).
   * @param {string} productName
   */
  async clickMoreMenuProduct(productName) {
    const { label } = this.getProductConfig(productName);
    const item = this.page
      .locator(SELECTORS.DROPDOWN_MENU_ITEM)
      .filter({ hasText: label })
      .first();
    try {
      await item.waitFor({ state: "visible", timeout: 10000 });
      await item.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[HomePage.clickMoreMenuProduct] Could not click the "${label}" entry in the "more products" menu ` +
          `(${SELECTORS.DROPDOWN_MENU_ITEM}). The menu may not be open or the product is not listed there. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the side-nav "Home Page" link to return to the homepage.
   */
  async clickHomeNavIcon() {
    const link = this.page.locator(SELECTORS.HOME_NAV_LINK).first();
    try {
      await link.waitFor({ state: "visible", timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[HomePage.clickHomeNavIcon] Could not click the "Home Page" link in the side nav (${SELECTORS.HOME_NAV_LINK}). ` +
          `The side nav may not be rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the homepage to be ready by confirming the product carousel is visible.
   * @param {number} [timeout=20000]
   */
  async waitForHomepageReady(timeout = 20000) {
    try {
      await this.page.locator(SELECTORS.PRODUCT_CAROUSEL).first().waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[HomePage.waitForHomepageReady] The homepage product carousel (${SELECTORS.PRODUCT_CAROUSEL}) did not become ` +
          `visible within ${timeout}ms. Navigation back to the homepage may have failed. Original: ${err.message}`
      );
    }
  }

  /**
   * Selects the "My upcoming trips" tab on the homepage trip-monitor panel, if present. The tab is
   * only rendered when the account has upcoming trips, so absence is a valid "empty" state, not an
   * error — returns whether the tab was found (and selected). Clicking is harmless when it is
   * already the active tab (the default when the account has no trips awaiting approval).
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>} true if the tab was present and selected
   */
  async selectUpcomingTripsTab(timeout = 15000) {
    const tab = this.page.locator(SELECTORS.UPCOMING_TRIPS_TAB).first();
    try {
      await tab.waitFor({ state: "visible", timeout });
    } catch {
      // Tab not rendered — the account has no upcoming trips. Let the caller treat this as empty.
      return false;
    }
    try {
      await tab.click({ timeout: 10000 });
      return true;
    } catch (err) {
      throw new Error(
        `[HomePage.selectUpcomingTripsTab] Found the "My upcoming trips" tab but could not click it ` +
          `(${SELECTORS.UPCOMING_TRIPS_TAB}). Original: ${err.message}`
      );
    }
  }

  /**
   * Counts the trip cards currently visible in the active trip-monitor tab. Returns 0 when no card
   * renders within the timeout (empty list) instead of throwing, so the calling step owns the
   * empty-vs-populated assertion and can surface its own message. The first card is awaited as a
   * page-ready check.
   * @param {number} [timeout=15000]
   * @returns {Promise<number>}
   */
  async getVisibleTripCardCount(timeout = 15000) {
    const cards = this.page.locator(SELECTORS.TRIP_CARD);
    try {
      await cards.first().waitFor({ state: "visible", timeout });
    } catch {
      // No card became visible — the active tab's list is empty.
      return 0;
    }
    return cards.count();
  }

  /**
   * Returns whether the given product tab is the active tab on the trip search page.
   * @param {string} tabId - el-tabs item id, e.g. "tab-flight"
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isProductTabActive(tabId, timeout = 15000) {
    // The el-tabs item carries id `tab-<product>` and gains .is-active when selected.
    const tab = this.page.locator(`#${tabId}.is-active`).first();
    try {
      await tab.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = HomePage;
