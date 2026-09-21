const { extractNumber } = require("@utils/dom");
const { escapeRegExp } = require("@utils/text");

/**
 * Page Object for common elements across pages.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Proceed and Save buttons.
  // Exact text, not `has-text`: this targets the "Proceed" CTA of the conflicting-quotes modal and
  // the reference-fields / research popups (en.json btn.proceed = common.proceed = "Proceed"). A
  // substring match also caught the cart's "Proceed to Checkout" CTA, so once the trip held a quote
  // the locator resolved to two elements and every caller died on a strict-mode violation.
  // "Proceed to Checkout" and "Proceed anyway" have their own dedicated selectors
  // (CartPage.PROCEED_TO_CHECKOUT_BUTTON, FLIGHT_CAPACITY_PROCEED_ANYWAY_TEXT) and are not wanted here.
  // `:visible` is part of the selector, not a caller concern. An earlier reference-fields popup (e.g. the
  // search-stage "New trip reference fields" dialog) stays in the DOM hidden after it closes, so by checkout
  // an unrestricted match resolves to the hidden leftover plus the live dialog and every caller dies on a
  // strict-mode violation. Only one of these dialogs is ever open at a time, so the visible match is
  // unambiguous, and every caller waits for visibility anyway.
  PROCEED_BUTTON: "button:text-is('Proceed'):visible",
  SAVE_BUTTON: "button:has-text('Save')",
  HEADINGS: 'h1, h2, h3, h4, h5, h6',

  // Modal buttons
  GO_BACK_BUTTON: "button:has-text('Go back')",
  FLIGHT_CAPACITY_MODAL_CONTAINER: '.app-dialog.conflicting-quotes-dialog',
  FLIGHT_CAPACITY_MODAL_CONTENT: '.app-dialog.conflicting-quotes-dialog .flight-capacity-violation-warning',
  FLIGHT_CAPACITY_MODAL_HEADING_TEXT: 'Flight Capacity Restriction',
  FLIGHT_CAPACITY_SEARCH_ALTERNATIVE_TEXT: 'Please search for alternative flight or proceed with justification',
  FLIGHT_CAPACITY_PROCEED_ANYWAY_TEXT: 'Proceed anyway',
  FLIGHT_CAPACITY_GO_BACK_TEXT: 'Go back',

  // 'Out of Policy' indicator
  OOP_TOOLTIP_TEXT: ".mb-1",
  OOP_INFO: ".app-out-of-policy",

  // Share email elements
  SHARE_EMAIL_ELEMENT: '.em_grey_txt',

  // Price elements
  AMOUNT_VALUE: ".amount",

  // Mandatory notification banner (trip-cart.vue)
  MANDATORY_NOTIFICATION: ".unread-messages",
  MANDATORY_NOTIFICATION_LINK: ".open-notifications",

  // Notification panel close button
  NOTIFICATION_PANEL_CLOSE: '.app-notification .close',

  // Push notification badge (header bell icon badge count)
  NOTIFICATION_BELL_BADGE: 'sup.notification-number',

  // Mandatory reminder popup dialog (app-reminder-popup.vue)
  REMINDER_POPUP_DIALOG: '.el-dialog .el-dialog__title',
  REMINDER_POPUP_CONTAINER: '.el-dialog.app-dialog',
  REMINDER_POPUP_CHECKBOX: '.el-checkbox',
  REMINDER_POPUP_CLOSE_BUTTON: 'button:has-text("close")',

  // Shopping cart icon
  SHOPPING_CART_ICON: 'span:has-text("shopping_cart")',

  // Cart-count badge on the trip-bar cart button (trip-bar.vue → el-badge :value="quotesLengthToShow").
  // Scoped by the shopping_cart icon so it never matches the unused-tickets or chat badges that also use .cart-btn/.el-badge.
  CART_BADGE_COUNT: '.cart-btn:has(span:has-text("shopping_cart")) .el-badge__content',

  // Hyperlink inside the mandatory-notifications reminder popup (app-reminder-popup.vue): the reminder
  // text is rendered via injectHyperlinks as `<a target="_blank" rel="noopener noreferrer">`, so
  // clicking it opens the linked page in a NEW browser tab. Scoped to the reminder dialog container.
  REMINDER_POPUP_HYPERLINK: '.el-dialog.app-dialog a[target="_blank"]',

  // Header notification bell button (cart-info-bar.vue) — an app-btn.chat-btn holding the
  // "assignment_turned_in" material icon (the sibling chat button holds "question_answer"). Clicking it
  // toggles the notification panel (app-notification.vue) open.
  NOTIFICATION_BELL_BUTTON: '.chat-btn:has(.material-symbols-outlined:has-text("assignment_turned_in"))',

  // Notification panel root (app-notification.vue) and the hyperlink inside a notification message.
  // The message body is rendered via injectHyperlinks, so an embedded URL becomes an
  // `<a target="_blank">` that opens the linked page in a NEW browser tab.
  NOTIFICATION_PANEL: '.app-notification',
  NOTIFICATION_MESSAGE_HYPERLINK: '.app-notification .notification-message a[target="_blank"]',
  // Message body text inside each notification row (app-notification.vue → .notification-text). Long
  // messages render truncated (item.ShortText), so callers must substring-match, never compare exact.
  NOTIFICATION_MESSAGE_TEXT: '.notification-message .notification-text',
  // Per-message "Mark as read" link in the NEW-messages section of the panel (app-notification.vue
  // renders `<span class="link-color" @click="markAsRead(item.Id)">` per unread message). `.link-color`
  // is shared with the Show more / Show less toggles inside the same block, so callers MUST filter it
  // by the link's own text (NOTIFICATION_MARK_AS_READ_TEXTS) instead of relying on its position.
  NOTIFICATION_MARK_AS_READ: '.notification-message .notification-text .link-color',
  // Every translation the app ships for `notificationCenter.markAsRead`
  // (Atriis.OBT/src/assets/locale/*.json), so the text filter above stays language-independent.
  NOTIFICATION_MARK_AS_READ_TEXTS: [
    'Mark as read',
    'Als gelesen markieren',
    'Marcar como leído',
    'Marquer comme lu',
    'Segna come letto',
    'Markeren als gelezen',
    'Marcar como lido',
  ],

  // Titles of the mandatory-notifications reminder popup (app-reminder-popup.vue → $t('common.mandatoryNotification')).
  // Both the reference-fields popup and this reminder popup render as `.el-dialog.app-dialog`, so the
  // reminder popup MUST be identified by its title — never by the generic dialog class.
  //
  // That title is translated, so one English string cannot find the popup in a scenario that switches
  // the application language (49309). These are every value the app ships for that key
  // (Atriis.OBT/src/assets/locale/*.json); matching any of them keeps the discrimination against the
  // reference-fields popup while staying language-independent.
  MANDATORY_NOTIFICATIONS_TITLES: [
    'Mandatory Notifications',
    'Obligatorische Benachrichtigungen',
    'Notificaciones obligatorias',
    'Notifications obligatoires',
    'Notifiche obbligatorie',
    'Verplichte meldingen',
    'Notificações Obrigatórias',
  ],

  // One reminder message inside the mandatory-notifications popup: app-reminder-popup.vue renders
  // `<p class="mt5" v-html="injectHyperlinks(reminder.text)">` per UNREAD reminder, so a popup can
  // carry several messages. Always used dialog-scoped (getMandatoryNotificationsDialog) — `.mt5` is a
  // generic spacing class elsewhere in the app.
  MANDATORY_NOTIFICATION_MESSAGE: 'p.mt5',

  // OPTIONAL push notifications (reminder.service.ts → showNotificationReminders): reminders of
  // type 11 are raised as ElNotification toasts (type 10 go to the popup above). Element Plus
  // renders each as `.el-notification[role=alert]` with the message in `.el-notification__content`.
  // They auto-dismiss after 7000ms, so an assertion has to run right after the search that raised them.
  OPTIONAL_NOTIFICATION_TOAST: '.el-notification',
  OPTIONAL_NOTIFICATION_TOAST_TEXT: '.el-notification .el-notification__content',

  // Trip number as it appears in a trip route, e.g. /trips/3837845.
  TRIP_NUMBER_IN_URL: /\/trips\/(\d+)(?:[/?#]|$)/i,
};

// One comma-separated `.el-dialog__title` selector covering every translation above, built once
// rather than per call, so getMandatoryNotificationsDialog composes no selector of its own.
const MANDATORY_NOTIFICATIONS_TITLE_SELECTOR = SELECTORS.MANDATORY_NOTIFICATIONS_TITLES
  .map((title) => `.el-dialog__title:has-text("${title}")`)
  .join(', ');

// Exact-text pattern matching any shipped "Mark as read" translation, built once rather than per
// call. Anchored so it cannot also match "Mark all as read" (a different control, .mark-all, which
// only renders when the "new" section is already empty).
const MARK_AS_READ_TEXT_PATTERN = new RegExp(
  '^\\s*(' +
    SELECTORS.NOTIFICATION_MARK_AS_READ_TEXTS
      .map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')\\s*$',
);

/**
 * Parses the primary (account-currency) amount from a shared email offer's
 * total text. Suppliers that quote in a different currency than the account
 * render the total as "<account amount> (<converted amount>)", e.g.
 * "Total: £92.00 ($123.70)". The parenthetical conversion is dropped so the
 * two amounts are not concatenated into an invalid number, and the first
 * monetary value is returned.
 *
 * @param {string|null} rawText
 * @returns {number|null} Parsed amount, or null if none found
 */
function parseFirstSharedOfferAmount(rawText) {
  if (!rawText) return null;

  // Remove any parenthetical converted-currency amount, e.g. "($123.70)".
  const withoutConversion = rawText.replace(/\([^)]*\)/g, " ");

  // Prefer a decimal price (e.g. 92.00, 1,987.23); fall back to an integer.
  const match =
    withoutConversion.match(/\d[\d,]*\.\d{1,2}/) || withoutConversion.match(/\d[\d,]*/);
  if (!match) return null;

  const value = Number(match[0].replace(/,/g, ""));
  return Number.isNaN(value) ? null : value;
}

class CommonPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * The trip number in the current URL, or null when the page is not on a trip route.
   *
   * Atomic read, no interpretation: which trip a caller should key off, and what to do when the
   * URL carries none, is a DSL decision (see Email.resolveItinerarySubjectHint).
   *
   * @returns {string|null}
   */
  getTripNumberFromUrl() {
    try {
      const match = String(this.page.url() || "").match(SELECTORS.TRIP_NUMBER_IN_URL);
      return match ? match[1] : null;
    } catch {
      // The page may be closed or mid-navigation; a caller has other sources to fall back on.
      return null;
    }
  }

  /**
   * Gets the Out of Policy indicator locator.
   * @returns {Locator} Playwright locator for the OOP indicator
   */
  getOOPInfo() {
    return this.page.locator(SELECTORS.OOP_INFO);
  }

  /**
   * Gets the Out of Policy info icon locator.
   * @param {number} [index=0] - Which OOP icon to target when multiple are on the
   *   page (e.g. a round-trip "selected leg" summary plus a fresh results list) —
   *   0 is the first/topmost, matching prior default behavior.
   * @returns {Locator} Playwright locator for the OOP info icon
   */
  getOOPInfoIcon(index = 0) {
    return this.page.locator(SELECTORS.OOP_INFO).locator("span.info-icon", { hasText: "info" }).nth(index);
  }

  getShoppingCartIcon() {
    return this.page.locator(SELECTORS.SHOPPING_CART_ICON);
  }

  /**
   * Returns whether any element currently on the page shows the given text. Domain-agnostic and
   * scope-agnostic (checks the whole page, including an open modal), for callers that only need
   * to confirm a piece of text is somewhere visible rather than in a specific product's results.
   * @param {string} text - Text to look for (partial match)
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @throws {Error} If "text" is not a non-empty string
   * @returns {Promise<boolean>}
   */
  async isTextVisible(text, { timeout = 15000 } = {}) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error(`[CommonPage.isTextVisible] "text" must be a non-empty string, got: ${typeof text} (${text})`);
    }

    const element = this.page.getByText(text, { exact: false }).first();
    try {
      await element.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads the trip-bar cart-count badge text (e.g. "1"), or null when no badge is shown.
   * The badge reflects the number of quotes on the trip and updates reactively, so it is
   * the signal that a shared/added quote has actually committed to the cart.
   *
   * @returns {Promise<string|null>}
   */
  async getCartBadgeText() {
    const badge = this.page.locator(SELECTORS.CART_BADGE_COUNT).first();
    if (!(await badge.count())) {
      return null;
    }
    const text = await badge.textContent().catch(() => null);
    return text ? text.trim() : null;
  }

  /**
   * Waits until the OOP text is visible
   */
  async waitForOOPVisible() {
    // Use .first() to avoid strict mode violation when multiple OOP indicators are present on the page
    await this.getOOPInfo().first().waitFor({ state: "visible", timeout: 30000});
  }

  /**
   * Waits until the OOP text is hidden
   */
  async waitForOOPNotVisible() {
    await this.getOOPInfo().waitFor({ state: "hidden", timeout: 30000 });
  }

  /**
   * Checks that every OOP indicator currently on the page is hidden.
   * Unlike waitForOOPNotVisible(), this does not wait for a visible->hidden
   * transition (which requires .waitFor() to resolve a single element and
   * breaks strict mode when multiple result cards each render their own
   * .app-out-of-policy section). Callers must first wait for the page
   * (results/cart) to finish loading so absence isn't misread as "hidden".
   * @returns {Promise<boolean>}
   */
  async isOOPHiddenEverywhere() {
    const indicators = this.getOOPInfo();
    const count = await indicators.count();
    for (let i = 0; i < count; i++) {
      if (await indicators.nth(i).isVisible()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Hovers over the Out of Policy info icon to reveal tooltip.
   * TODO: Move this to ResultsPage - this is specific to results page.
   * @param {number} [index=0] - Which OOP icon to hover, see getOOPInfoIcon()
   */
  async hoverOverOOPInfoIcon(index = 0) {
    await this.getOOPInfoIcon(index).hover();
  }

  /**
   * Waits until the OOP tooltip is visible
   * @param {number} [index=0] - Which OOP icon to wait for, see getOOPInfoIcon()
   */
  async waitForOOPTooltipVisible(index = 0) {
    await this.getOOPInfoIcon(index).waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Retrieves the Out of Policy tooltip text.
   *
   * Returns the trimmed text content or empty string if not found.
   * Uses `li.mb-1` to avoid strict mode violation with generic `.mb-1` elements on the page.
   */
  async getOOPTooltipText() {
    await this.waitForOOPTooltipVisible();
    const tooltipText = this.page.locator('li' + SELECTORS.OOP_TOOLTIP_TEXT);
    return (await tooltipText.first().textContent())?.trim() ?? "";
  }

  /**
   * Retrieves the Out of Policy tooltip text from the cart page.
   * Uses nth(2) because the cart tooltip is the third .mb-1 element on the page.
   *
   * @returns {Promise<string>} Trimmed text content or empty string if not found.
   */
  async getOOPTooltipTextCart() {
    await this.waitForOOPTooltipVisible();
    const tooltipText = this.page.locator(SELECTORS.OOP_TOOLTIP_TEXT).nth(2);
    return (await tooltipText.textContent())?.trim() ?? "";
  }

  /**
   * Waits for the Flight Capacity Restriction pop-up to be displayed.
   */
  async waitFlightCapacityRestrictionPopUpOOPDisplayed() {
    await this.page.getByRole("heading", {
      name: SELECTORS.FLIGHT_CAPACITY_MODAL_HEADING_TEXT,
      level: 2,
    }).waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Gets the Flight Capacity Restriction modal content container.
   * @returns {import('@playwright/test').Locator}
   */
  getFlightCapacityRestrictionModalContent() {
    return this.page.locator(SELECTORS.FLIGHT_CAPACITY_MODAL_CONTENT).first();
  }

  /**
   * Gets the Proceed anyway button inside the Flight Capacity Restriction modal.
   * @returns {import('@playwright/test').Locator}
   */
  getFlightCapacityRestrictionProceedAnywayButton() {
    return this.page.getByRole('button', { name: SELECTORS.FLIGHT_CAPACITY_PROCEED_ANYWAY_TEXT });
  }

  /**
   * Gets the Go back button inside the Flight Capacity Restriction modal.
   * @returns {import('@playwright/test').Locator}
   */
  getFlightCapacityRestrictionGoBackButton() {
    return this.page.getByRole('button', { name: SELECTORS.FLIGHT_CAPACITY_GO_BACK_TEXT });
  }

  /**
   * Validates the visible Flight Capacity Restriction modal content.
   *
   * @param {{ flightNumber: string, passengerCount: number, timeout?: number }} options
   * @returns {Promise<string>}
   */
  async assertFlightCapacityRestrictionModalContent({ flightNumbers, passengerCount, timeout = 30000 } = {}) {
    const normalizedFlightNumbers = Array.isArray(flightNumbers)
      ? flightNumbers.filter((flightNumber) => typeof flightNumber === 'string' && flightNumber.trim())
      : [flightNumbers].filter((flightNumber) => typeof flightNumber === 'string' && flightNumber.trim());

    if (!normalizedFlightNumbers.length) {
      throw new Error(`flightNumbers must include at least one non-empty string, got: ${typeof flightNumbers}`);
    }

    if (!Number.isInteger(passengerCount) || passengerCount < 1) {
      throw new Error(`passengerCount must be an integer >= 1, got: ${passengerCount}`);
    }

    await this.waitFlightCapacityRestrictionPopUpOOPDisplayed();

    const modal = this.getFlightCapacityRestrictionModalContent();
    await modal.waitFor({ state: 'visible', timeout });

    const modalText = ((await modal.innerText()) ?? '').replace(/\s+/g, ' ').trim();
    for (const flightNumber of normalizedFlightNumbers) {
      const passengerPattern = new RegExp(
        `${escapeRegExp(flightNumber)}.*\\d+\\s+passengers?\\s+booked\\s+on\\s+this\\s+flight`,
        'i',
      );

      if (!modalText.includes(flightNumber)) {
        throw new Error(`Flight Capacity Restriction modal does not include flight number ${flightNumber}. Modal text: "${modalText}"`);
      }

      if (!passengerPattern.test(modalText)) {
        throw new Error(
          `Flight Capacity Restriction modal does not include the expected passenger warning text for ${flightNumber}. Modal text: "${modalText}"`,
        );
      }
    }

    if (!modalText.includes(SELECTORS.FLIGHT_CAPACITY_SEARCH_ALTERNATIVE_TEXT)) {
      throw new Error(
        `Flight Capacity Restriction modal does not include the expected guidance text. Modal text: "${modalText}"`,
      );
    }

    await this.getFlightCapacityRestrictionProceedAnywayButton().waitFor({ state: 'visible', timeout });
    await this.getFlightCapacityRestrictionGoBackButton().waitFor({ state: 'visible', timeout });

    return modalText;
  }

  /**
   * Clicks 'Proceed anyway' button on the Flight Capacity Restriction pop-up.
   */
  async clickProceedAnywayOnFlightCapacityRestrictionPopUp() {
    await this.getFlightCapacityRestrictionProceedAnywayButton().click();
  }

  /**
   * Gets the Success notification locator.
   *
   * `.first()` is required, not a convenience: element-plus stacks one el-notification per message
   * (#notification_1, #notification_2, ...), and some actions raise two at once — adding an
   * agent-suggested quote to a trip reports both the quote add and the trip update (test 55155).
   * The unscoped locator then fails Playwright's strict mode instead of resolving. Both callers
   * only wait for a success toast to appear, so taking the first is the same assertion.
   * @returns {Locator} Playwright locator for the Success notification.
   */
  getSuccessNotification() {
    return this.page.getByText("Success", { exact: true }).first();
  }

  /**
   * Gets the Proceed button element.
   * @returns {import('@playwright/test').Locator}
   */
  getProceedButton() {
    return this.page.locator(SELECTORS.PROCEED_BUTTON);
  }

  /**
   * Gets the Save button element.
   * @returns {import('@playwright/test').Locator}
   */
  getSaveButton() {
    return this.page.locator(SELECTORS.SAVE_BUTTON);
  }

  /**
   * Clicks the Proceed button.
   */
  async clickProceedButton() {
    await this.getProceedButton().click();
  }

  /**
   * Clicks the Proceed button if it becomes visible within timeout.
   * Does nothing and returns false if the button never appears.
   * @param {number} timeout - Max ms to wait for the button (default: 10000)
   * @returns {Promise<boolean>} True if clicked, false if not displayed
   */
  async clickProceedButtonIfVisible(timeout = 10000) {
    // A hidden-only Proceed matches nothing (see PROCEED_BUTTON), which is the same "not displayed"
    // outcome this helper already returns false for.
    const button = this.getProceedButton();
    const isVisible = await button.isVisible();

    if (!isVisible) {
      // Wait for button to potentially appear after async operations
      const appeared = await button.waitFor({ state: 'visible', timeout }).then(() => true, () => false);
      if (!appeared) return false;
    }

    await button.click();
    return true;
  }

  /**
   * Clicks the Save button.
   */
  async clickSaveButton() {
    await this.getSaveButton().click();
  }

  /**
   * Clicks the Save button if it becomes visible within timeout.
   * Does nothing and returns false if the button never appears (mirrors
   * clickProceedButtonIfVisible — used for optional modals like the Trip Reference Form).
   * @param {number} timeout - Max ms to wait for the button (default: 10000)
   * @returns {Promise<boolean>} True if clicked, false if not displayed
   */
  async clickSaveButtonIfVisible(timeout = 10000) {
    const button = this.getSaveButton().first();
    const isVisible = await button.isVisible();

    if (!isVisible) {
      const appeared = await button.waitFor({ state: 'visible', timeout }).then(() => true, () => false);
      if (!appeared) return false;
    }

    await button.click();
    return true;
  }

  /**
   * Clicks 'Go back' button on the Flight Capacity Restriction pop-up.
   */
  async clickGoBackOnFlightCapacityRestrictionPopUp() {
    await this.getFlightCapacityRestrictionGoBackButton().click();
  }

  //This can be used when sharing quotes or itinerary from Results page as well
  /**
   * Waits until a field label is visible in the share pop-up.
   *
   * @param {string} fieldLabel
   */
  async waitForFieldLabelSharePopUp(fieldLabel) {
    if (!fieldLabel || typeof fieldLabel !== "string") {
      throw new Error("fieldLabel must be a non-empty string");
    }

    const label = this.page.getByText(fieldLabel, { exact: true });
    await label.waitFor({ state: "visible", timeout: 60000 });
  }

  /**
   * Waits until the "Subject" label is visible.
   */
  async waitForSubjectLabelSharePopUp() {
    const subjectLabel = this.page.getByText("Subject", { exact: true });
    const sendButton = this.page.getByRole('button', { name: 'Send' });

    await Promise.any([
      subjectLabel.waitFor({ state: 'visible', timeout: 60000 }),
      sendButton.waitFor({ state: 'visible', timeout: 60000 }),
    ]);
  }

  /**
   * Extracts price from email preview for a specific flight offer.
   * Searches both main page and iframes (email preview).
   *
   * The offer total can be rendered in two currencies — the account currency
   * followed by a converted amount in parentheses, e.g. "Total: £92.00
   * ($123.70)". The primary (first) amount is the one the booker sees and the
   * one the results price is captured in, so the parenthetical conversion is
   * stripped before parsing. Stripping all non-digits (the previous approach)
   * merged both amounts into an invalid number (NaN) for such suppliers.
   *
   * @param {number} index - Index of the price element in the email preview
   * @returns {Promise<number|null>} The price value
   */
  async getPriceFromEmailOffer(index) {
    // Try the main page first, then any iframes (the email preview renders in one).
    const contexts = [this.page, ...this.page.frames().filter((f) => f !== this.page.mainFrame())];
    for (const context of contexts) {
      const elements = context.locator(SELECTORS.SHARE_EMAIL_ELEMENT);
      if ((await elements.count()) > index) {
        const rawText = await elements.nth(index).textContent();
        const price = parseFirstSharedOfferAmount(rawText);
        if (price !== null) return price;
      }
    }

    return null;
  }

  /**
   * Scrolls a flight offer into view within the share dialog or email preview.
   * Searches both the main page and iframes to locate the offer.
   * 
   * @param {number} offerNumber - Flight offer number (1 for first, 2 for second)
   * @param {number} timeout - Maximum time to wait for the offer to be visible (default: 30000ms)
   * @returns {Promise<void>}
   * @throws {Error} If the offer is not found in main page or any iframe
   */
  async scrollIntoViewOffer(offerNumber = 1, timeout = 30000) {
    const offerText = `Flight Offer # ${offerNumber} Pending booking`;

    // Wait for the offer text to appear in main page or iframes (content loads async in share dialog)
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      // Try main page first
      const offer = this.page.getByText(offerText, { exact: true });
      if (await offer.count()) {
        await offer.first().scrollIntoViewIfNeeded();
        await offer.first().waitFor({ state: 'visible', timeout: Math.max(deadline - Date.now(), 5000) });
        return;
      }

      // Fallback: search inside iframes (email / preview cases)
      for (const frame of this.page.frames()) {
        if (frame === this.page.mainFrame()) continue;

        const inFrame = frame.getByText(offerText, { exact: true });
        if (await inFrame.count()) {
          await inFrame.first().scrollIntoViewIfNeeded();
          await inFrame.first().waitFor({ state: 'visible', timeout: Math.max(deadline - Date.now(), 5000) });
          return;
        }
      }

      // Content not loaded yet — wait briefly before retrying
      await this.page.waitForTimeout(1000);
    }

    throw new Error(`Offer not found: "${offerText}"`);
  }

  /**
   * Clicks the shopping cart icon to navigate to cart.
   */
  async clickTripCart() {
    await this.getShoppingCartIcon().click();
  }

  /**
   * Checks if the mandatory notification banner is visible.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isMandatoryNotificationVisible({ timeout = 15000 } = {}) {
    const notification = this.page.locator(SELECTORS.MANDATORY_NOTIFICATION).first();
    try {
      await notification.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the mandatory notification link to open and dismiss it.
   */
  async clickMandatoryNotificationLink() {
    const link = this.page.locator(SELECTORS.MANDATORY_NOTIFICATION_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    await link.click();
  }

  /**
   * Reads the text of the mandatory-unread banner that replaces the cart checkout error slot while
   * the traveler still has unread mandatory notifications (trip-cart.vue -> `.unread-messages`,
   * $t('validation.unReadMessages1') + $t('validation.unReadMessages2')). Whitespace is collapsed to
   * a single space because the banner is split across two elements and rendered over several lines.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The banner text, whitespace-collapsed and trimmed.
   */
  async getMandatoryUnreadMessageText({ timeout = 15000 } = {}) {
    const banner = this.page.locator(SELECTORS.MANDATORY_NOTIFICATION).first();
    try {
      await banner.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CommonPage.getMandatoryUnreadMessageText] The mandatory-unread banner (${SELECTORS.MANDATORY_NOTIFICATION}) ` +
        `never became visible within ${timeout}ms. Checkout is probably NOT blocked — either the traveler has no ` +
        `unread mandatory notifications, or the cart never reached the disabled-checkout state. Original: ${error.message}`,
      );
    }
    const text = await banner.innerText();
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Clicks every per-message "Mark as read" link in the currently open notification panel, one at a
   * time. Each click removes that message from the "new" section and re-renders the list, so the
   * links are re-resolved on every pass rather than collected up front.
   * @param {object} [options]
   * @param {number} [options.timeout=10000] Max time to wait for each link to become clickable.
   * @param {number} [options.maxLinks=20] Safety bound, so a list that never shrinks cannot loop forever.
   * @returns {Promise<number>} How many links were clicked.
   */
  async clickAllMarkAsReadLinks({ timeout = 10000, maxLinks = 20 } = {}) {
    const markAsRead = this.page
      .locator(`${SELECTORS.NOTIFICATION_PANEL}:visible ${SELECTORS.NOTIFICATION_MARK_AS_READ}`)
      .filter({ hasText: MARK_AS_READ_TEXT_PATTERN });

    // The panel lazy-renders its rows after `.app-notification` itself is visible, and count() does
    // NOT wait — reading it pre-paint returns 0 and would skip the loop entirely, surfacing as a
    // bogus "no unread messages" error upstream. Wait for the first link, but tolerate a genuinely
    // empty notification center: the caller decides whether zero clicked is an error.
    await markAsRead.first().waitFor({ state: 'visible', timeout }).catch(() => {});

    let clicked = 0;
    while (clicked < maxLinks) {
      const remaining = await markAsRead.count();
      if (remaining === 0) break;

      try {
        await markAsRead.first().click({ timeout });
      } catch (error) {
        throw new Error(
          `[CommonPage.clickAllMarkAsReadLinks] Failed to click "Mark as read" link #${clicked + 1} in the ` +
            `notification panel. The panel may have closed or re-rendered mid-click. Original: ${error.message}`,
        );
      }
      clicked += 1;

      // markAsRead(item.Id) re-renders the "new" section; wait for the list to actually SHRINK before
      // re-reading it. Waiting on first() to detach would not work — it re-resolves to the next
      // surviving link and so never reports detached while others remain, burning the full timeout
      // on every pass but the last. The last index must disappear once any one row is removed.
      await markAsRead.nth(remaining - 1).waitFor({ state: 'detached', timeout }).catch(() => {});
    }

    if (clicked >= maxLinks && (await markAsRead.count()) > 0) {
      throw new Error(
        `[CommonPage.clickAllMarkAsReadLinks] Clicked ${maxLinks} "Mark as read" links but unread messages ` +
          `still remain. The list is not shrinking — markAsRead may be failing server-side, or the panel ` +
          `is re-rendering the same message.`,
      );
    }

    return clicked;
  }

  /**
   * Closes the notification panel by clicking the close button.
   */
  async closeNotificationPanel() {
    const closeBtn = this.page.locator(SELECTORS.NOTIFICATION_PANEL_CLOSE).first();
    await closeBtn.waitFor({ state: 'visible', timeout: 15000 });
    await closeBtn.click();
  }

  /**
   * Reads the text of every notification message in the currently open, VISIBLE notification panel
   * (app-notification.vue). Scoped to the visible panel so the app's hidden responsive duplicates are
   * not double-counted. Long messages are rendered truncated (item.ShortText), so callers must
   * substring-match rather than compare exact text. Whitespace is collapsed to a single space.
   * @param {object} [options]
   * @param {number} [options.timeout=10000] Max time to wait for the panel to populate with messages.
   * @returns {Promise<string[]>} Trimmed message texts, in DOM order.
   */
  async getVisibleNotificationMessageTexts({ timeout = 10000 } = {}) {
    const messages = this.page.locator(`${SELECTORS.NOTIFICATION_PANEL}:visible ${SELECTORS.NOTIFICATION_MESSAGE_TEXT}`);
    // Wait for the panel to lazy-render its messages, but tolerate a genuinely empty notification
    // center (no messages) instead of failing — callers assert on the returned contents.
    await messages.first().waitFor({ state: 'visible', timeout }).catch(() => {});
    const texts = await messages.allInnerTexts();
    return texts.map((t) => (t || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /**
   * Checks if the push notification badge (bell icon count) is visible in the header.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isNotificationBadgeVisible({ timeout = 15000 } = {}) {
    const badge = this.page.locator(SELECTORS.NOTIFICATION_BELL_BADGE).first();
    try {
      await badge.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the notification panel (.app-notification) is visible.
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isNotificationPanelVisible({ timeout = 5000 } = {}) {
    const panel = this.page.locator(SELECTORS.NOTIFICATION_PANEL_CLOSE).first();
    try {
      await panel.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the mandatory reminder popup dialog is visible.
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isReminderPopupVisible({ timeout = 5000 } = {}) {
    const title = this.page.locator(SELECTORS.REMINDER_POPUP_DIALOG).first();
    try {
      await title.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dismisses the mandatory reminder popup by checking "Got it" and clicking "close".
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   */
  async dismissReminderPopup({ timeout = 5000 } = {}) {
    const dialog = this.page.locator(SELECTORS.REMINDER_POPUP_CONTAINER).first();
    await dialog.waitFor({ state: 'visible', timeout });
    const checkbox = dialog.locator(SELECTORS.REMINDER_POPUP_CHECKBOX).first();
    await checkbox.click();
    const closeBtn = dialog.locator(SELECTORS.REMINDER_POPUP_CLOSE_BUTTON).first();
    await closeBtn.waitFor({ state: 'visible', timeout });
    await closeBtn.click();
    await dialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Clicks the hyperlink embedded in the mandatory-notifications reminder popup (app-reminder-popup.vue).
   * The link carries target="_blank", so the click opens the linked page in a NEW browser tab. Registers
   * the context 'page' listener before clicking and returns the newly opened tab.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<import('playwright').Page>} The newly opened tab
   */
  /**
   * Returns a locator for the mandatory-notifications reminder dialog (app-reminder-popup.vue),
   * identified by its title. Both the reference-fields popup and this reminder popup render as
   * `.el-dialog.app-dialog`, so scoping by title is the only reliable way to target THIS dialog and not
   * the reference-fields popup that may still be closing.
   * @returns {import('playwright').Locator}
   */
  getMandatoryNotificationsDialog() {
    return this.page
      .locator('.el-dialog')
      .filter({ has: this.page.locator(MANDATORY_NOTIFICATIONS_TITLE_SELECTOR) })
      // The app renders hidden responsive duplicates of the dialog; a bare .first() can resolve to a
      // hidden copy and make waitFor({ state: 'visible' }) time out even though the popup IS on screen.
      // Scope to the visible instance so every caller (visibility check, hyperlink, acknowledge) targets it.
      .filter({ visible: true })
      .first();
  }

  /**
   * Returns true if the mandatory-notifications popup (titled "Mandatory Notifications") is visible.
   * Unlike isReminderPopupVisible (which matches any dialog title), this is specific to the reminder
   * popup so it never gives a false positive on the reference-fields popup.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isMandatoryNotificationsPopupVisible({ timeout = 15000 } = {}) {
    try {
      await this.getMandatoryNotificationsDialog().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads every reminder message rendered inside the open mandatory-notifications popup. The popup
   * renders one `p.mt5` per UNREAD reminder, so a corporation with several mandatory notifications for
   * the same search shows several messages in one dialog. Whitespace is collapsed to a single space.
   * @param {object} [options]
   * @param {number} [options.timeout=15000] Max time to wait for the first message to render.
   * @returns {Promise<string[]>} Message texts, in DOM order.
   */
  async getMandatoryNotificationMessages({ timeout = 15000 } = {}) {
    const messages = this.getMandatoryNotificationsDialog().locator(SELECTORS.MANDATORY_NOTIFICATION_MESSAGE);
    // Tolerate an empty body instead of throwing here — callers assert on the returned contents and
    // can report what was actually on screen.
    await messages.first().waitFor({ state: 'visible', timeout }).catch(() => {});
    const texts = await messages.allInnerTexts();
    return texts.map((t) => (t || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /**
   * Waits for an OPTIONAL push-notification toast (ElNotification, reminder type 11) whose message
   * contains the given text. Matched by text rather than by position because several optional
   * notifications stack at once, and each toast is removed after 7 seconds — so this must be awaited
   * immediately after the action that raised it.
   * @param {string} expectedText - Substring the toast message must contain (case-insensitive).
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The full text of the matched toast.
   */
  async waitForOptionalNotificationToast(expectedText, { timeout = 15000 } = {}) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('[CommonPage.waitForOptionalNotificationToast] "expectedText" must be a non-empty string.');
    }
    const toast = this.page
      .locator(SELECTORS.OPTIONAL_NOTIFICATION_TOAST)
      .filter({ hasText: new RegExp(escapeRegExp(expectedText), 'i') })
      .first();
    try {
      await toast.waitFor({ state: 'visible', timeout });
    } catch (err) {
      const visible = await this.page.locator(SELECTORS.OPTIONAL_NOTIFICATION_TOAST_TEXT).allInnerTexts().catch(() => []);
      throw new Error(
        `[CommonPage.waitForOptionalNotificationToast] No optional push-notification toast containing ` +
        `"${expectedText}" appeared within ${timeout}ms. Toast(s) on screen: ` +
        `${visible.length ? visible.map((t) => `"${t.replace(/\s+/g, ' ').trim()}"`).join(', ') : 'none'}. ` +
        `(Optional notifications auto-dismiss after 7s — assert them immediately after the search that ` +
        `raises them.) Original: ${err.message}`
      );
    }
    return (await toast.innerText()).replace(/\s+/g, ' ').trim();
  }

  /**
   * Returns the titles of all currently-visible dialogs — used to build actionable error messages when
   * an expected dialog is not the one on screen.
   * @returns {Promise<string[]>}
   */
  async getVisibleDialogTitles() {
    return this.page.evaluate(() => {
      const vis = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
      return Array.from(document.querySelectorAll('.el-dialog'))
        .filter(vis)
        .map((d) => {
          const t = d.querySelector('.el-dialog__title');
          return t ? t.textContent.replace(/\s+/g, ' ').trim() : '(untitled)';
        });
    });
  }

  /**
   * Clicks the hyperlink embedded in the mandatory-notifications reminder popup (app-reminder-popup.vue),
   * scoped to the "Mandatory Notifications" dialog so it never hits the reference-fields popup's links.
   * The link carries target="_blank", so the click opens the linked page in a NEW browser tab. Registers
   * the context 'page' listener before clicking and returns the newly opened tab plus its href.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<{page: import('playwright').Page, href: string}>} The newly opened tab and the link href
   */
  async clickReminderPopupHyperlink({ timeout = 15000 } = {}) {
    const dialog = this.getMandatoryNotificationsDialog();
    const link = dialog.locator('a[target="_blank"]').first();
    try {
      await link.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CommonPage.clickReminderPopupHyperlink] No hyperlink (a[target="_blank"]) was visible inside the ` +
        `"Mandatory Notifications" popup within ${timeout}ms. The popup may not be open, or the notification has no ` +
        `embedded link. Original: ${err.message}`
      );
    }

    // Capture the link's target BEFORE clicking so the verify step can confirm the new tab navigated to
    // THIS link's page (the configured URL varies per profile — do not assume a specific site).
    const href = await link.getAttribute('href');
    const context = this.page.context();
    const newPagePromise = context.waitForEvent('page', { timeout });
    await link.click({ timeout });

    let newPage;
    try {
      newPage = await newPagePromise;
    } catch (err) {
      throw new Error(
        `[CommonPage.clickReminderPopupHyperlink] Clicking the notification hyperlink did not open a new tab ` +
        `within ${timeout}ms. Expected the target="_blank" link to open the linked page in a new tab. ` +
        `Original: ${err.message}`
      );
    }

    await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    return { page: newPage, href };
  }

  /**
   * Returns a locator for the "close" button inside the mandatory-notifications popup
   * (app-reminder-popup.vue). The popup renders `<app-btn :isDisabled="!wasCheck">` and app-btn.vue
   * renders `<button :disabled="isDisabled">`, so this button carries the NATIVE disabled attribute for
   * as long as the "Got it" checkbox is unchecked — which is what makes it assertable with
   * toBeDisabled(). The dialog is declared with `:show-close="false"`, so there is no header X to
   * collide with. Scoped to the VISIBLE "Mandatory Notifications" dialog, like every other consumer of
   * getMandatoryNotificationsDialog, so a hidden responsive duplicate is never picked up.
   * @returns {import('playwright').Locator}
   */
  getMandatoryNotificationsCloseButton() {
    return this.getMandatoryNotificationsDialog().locator(SELECTORS.REMINDER_POPUP_CLOSE_BUTTON).first();
  }

  /**
   * Acknowledges the mandatory-notifications popup by checking its "Got it" box and clicking "close",
   * scoped to the "Mandatory Notifications" dialog. Marks the reminders as read and waits for the dialog
   * to close.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async acknowledgeMandatoryNotificationsPopup({ timeout = 15000 } = {}) {
    const dialog = this.getMandatoryNotificationsDialog();
    await dialog.waitFor({ state: 'visible', timeout });
    const checkbox = dialog.locator(SELECTORS.REMINDER_POPUP_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout });
    await checkbox.click();
    const closeBtn = dialog.locator(SELECTORS.REMINDER_POPUP_CLOSE_BUTTON).first();
    await closeBtn.waitFor({ state: 'visible', timeout });
    await closeBtn.click();
    await dialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Opens the header notification panel (app-notification.vue) by clicking the bell button in the cart
   * info bar, and waits for the panel to render.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async openNotificationPanel({ timeout = 15000 } = {}) {
    const bell = this.page.locator(SELECTORS.NOTIFICATION_BELL_BUTTON).first();
    try {
      await bell.waitFor({ state: 'visible', timeout });
      await bell.click({ timeout });
    } catch (err) {
      throw new Error(
        `[CommonPage.openNotificationPanel] Could not find/click the notification bell button in the cart info ` +
        `bar within ${timeout}ms. The cart may not be loaded, or no notifications exist for this trip. ` +
        `Original: ${err.message}`
      );
    }
    const panel = this.page.locator(SELECTORS.NOTIFICATION_PANEL).first();
    await panel.waitFor({ state: 'visible', timeout });
  }

  /**
   * Clicks the hyperlink inside the first notification message in the open notification panel
   * (app-notification.vue). The message body is rendered via injectHyperlinks, so an embedded URL is an
   * `<a target="_blank">` that opens the linked page in a NEW browser tab. Registers the context 'page'
   * listener before clicking and returns the newly opened tab.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<import('playwright').Page>} The newly opened tab
   */
  async clickNotificationPanelHyperlink({ timeout = 15000 } = {}) {
    const link = this.page.locator(SELECTORS.NOTIFICATION_MESSAGE_HYPERLINK).first();
    try {
      await link.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CommonPage.clickNotificationPanelHyperlink] No hyperlink (a[target="_blank"]) was visible inside a ` +
        `notification message in the open notification panel within ${timeout}ms. The panel may not be open, or ` +
        `no notification carries an embedded link. Original: ${err.message}`
      );
    }

    // Capture the link's target BEFORE clicking so the verify step can confirm the new tab navigated to
    // THIS link's page (the configured URL varies per profile — do not assume a specific site).
    const href = await link.getAttribute('href');
    const context = this.page.context();
    const newPagePromise = context.waitForEvent('page', { timeout });
    await link.click({ timeout });

    let newPage;
    try {
      newPage = await newPagePromise;
    } catch (err) {
      throw new Error(
        `[CommonPage.clickNotificationPanelHyperlink] Clicking the notification hyperlink did not open a new tab ` +
        `within ${timeout}ms. Expected the target="_blank" link to open the linked page in a new tab. ` +
        `Original: ${err.message}`
      );
    }

    await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    return { page: newPage, href };
  }

  /**
   * Extracts the displayed price amount from any page.
   * 
   * @param {number} index - Zero-based index of the amount element (default: 0)
   * @returns {Promise<number|null>} The price value or null if not found
   * @example
   *   getAmountPriceValue(0)  → first price
   *   getAmountPriceValue(1)  → second price
   */
  async getAmountPriceValue(index = 0) {
    return extractNumber(this.page, SELECTORS.AMOUNT_VALUE, index);
  }

  /**
   * Gets a heading element by its text content.
   * @param {string} text - The text content of the heading
   * @returns {Locator} Playwright locator for the heading
   */
  getHeadingByText(text) {
    return this.page.getByRole('heading', { name: text });
  }

  /**
   * Gets the first VISIBLE heading with the given text.
   *
   * Use this to assert a heading is on screen: the same text can legitimately be rendered as more
   * than one heading (the hotel details drawer titles both its overview section `h3` and a nested
   * `h4` "Overview"), and asserting on the unfiltered locator fails with a strict-mode violation
   * rather than reporting whether the heading is there. Filtering by visibility first also skips
   * the hidden responsive duplicates some layouts keep in the DOM.
   *
   * @param {string} text - The text content of the heading
   * @returns {Locator} Playwright locator for the first visible matching heading
   */
  getVisibleHeadingByText(text) {
    return this.getHeadingByText(text).filter({ visible: true }).first();
  }

  /**
   * Scrolls the window to the given coordinates. When `y` is omitted, scrolls to the bottom of the
   * page (document height) — used to reveal content below the fold, e.g. the hotel section of the
   * travel-request form. Ported from the Testim `scrollTo(page, x, y)` helper.
   *
   * @param {number} [x=0] - Horizontal scroll position in pixels
   * @param {number|null} [y=null] - Vertical scroll position in pixels; null = scroll to bottom
   */
  async scrollTo(x = 0, y = null) {
    await this.page.evaluate(
      ({ x, y }) => window.scrollTo(x, y == null ? document.body.scrollHeight : y),
      { x, y }
    );
  }

  /**
   * Gets the first heading element containing the given text.
   * @param {string} text - Partial text content of the heading
   * @returns {Locator} Playwright locator for the heading
   */
  getHeadingContainingText(text) {
    return this.page.locator(SELECTORS.HEADINGS, { hasText: text }).first();
  }

  /**
   * Checks if a heading with the given text is visible.
   * @param {string} text - The text content of the heading to check
   * @param {number} timeout - Maximum wait time (default: 30000ms)
   * @returns {Promise<boolean>} True if heading is visible
   */
  async isHeadingVisible(text, { timeout = 30000 } = {}) {
    try {
      await this.getHeadingByText(text).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a heading containing the given text is visible.
   * @param {string} text - Partial text content of the heading to check
   * @param {{ timeout?: number }} options - Wait options
   * @returns {Promise<boolean>} True if heading is visible
   */
  async isHeadingContainingTextVisible(text, { timeout = 30000 } = {}) {
    try {
      await this.getHeadingContainingText(text).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates and asserts CO2 eco-label is displayed with valid numeric value.
   * 
   * @param {() => Promise<boolean>} isCO2LabelVisible - Async fn that returns true if label is visible
   * @param {() => Promise<string>}  getCO2Value       - Async fn that returns the CO2 text value
   * @param {string}                 context           - Human-readable location for error messages
   * @returns {Promise<{visible: boolean, value: string}>}
   * @throws {Error} If CO2 label is not visible or value is not a positive number
   */
  async assertCO2Displayed(isCO2LabelVisible, getCO2Value, context) {
    const isVisible = await isCO2LabelVisible();
    if (!isVisible) {
      throw new Error(`CO2 eco-label is not visible in ${context}`);
    }

    const value = await getCO2Value();
    const numericValue = parseFloat(value.replace(/,/g, ''));

    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error(`CO2 value must be a positive number, got: "${value}" (${context})`);
    }

    return { visible: true, value };
  }
}

module.exports = {
  CommonPage,
  SELECTORS,
};
