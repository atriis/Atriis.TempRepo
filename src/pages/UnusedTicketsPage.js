const SELECTORS = {
  // Unused tickets icon - search page (airplane_ticket span next to traveler name in trip-traveler-tag)
  UNUSED_TICKETS_BTN_SEARCH: '.unused-tickets-btn',

  // Unused tickets icon - results page trip bar (trip-bar.vue / cart-info-bar.vue).
  // '.is-clickable' renders for a single traveler ('.is-unclickable' when more than one).
  UNUSED_TICKETS_ICON_RESULTS: '.unused-tickets-icon.is-clickable',

  // Unused tickets modal/dialog
  UNUSED_TICKETS_DIALOG: '.app-dialog .app-unused-tickets',
  // El-dialog root wrapping the unused-tickets body — scopes the header close button (a body sibling).
  UNUSED_TICKETS_DIALOG_ROOT: '.app-dialog:has(.app-unused-tickets)',
  UNUSED_TICKETS_CONTAINER: '.app-unused-tickets .unused-tickets-container',
  // Element Plus dialog header close button (X)
  DIALOG_HEADER_CLOSE_BTN: '.el-dialog__headerbtn',

  // Unused tickets banner on results page (the <unused-tickets-banner> component; note .stay-safe-banner is
  // a different, COVID-safety banner)
  UNUSED_TICKETS_BANNER: '.unused-tickets-banner',
  UNUSED_TICKETS_VIEW_DETAILS: '.view-details-btn',

  // Unused tickets results filter ("Unused Tickets Available" checkbox in the left filter panel)
  UNUSED_TICKETS_FILTER: '.el-checkbox:has-text("Unused Tickets Available")',

  // Checkout: stable section wrapping the unused tickets checkbox + radio list
  UNUSED_TICKETS_CHECKOUT_SECTION: '.reference-form-contact-details:has(.unused-tickets-checkbox)',
  UNUSED_TICKETS_CHECKBOX: '.unused-tickets-checkbox',

  // Checkout: the <reference-form-unused-ticket-layout> component, one per flight in the quote.
  UNUSED_TICKETS_CHECKOUT_LAYOUT: '.reference-form-unused-ticket-layout',
  // One el-radio per offered ticket; its text carries the ticket number and the record locator,
  // which is how a single ticket is addressed - the rows expose no per-ticket test id.
  UNUSED_TICKETS_CHECKOUT_ROW: '.unused-ticket-radio',
  // A ticket already in use, or one the supplier will not put towards a residual, still renders -
  // it is listed but cannot be picked, so selection has to skip it.
  UNUSED_TICKETS_CHECKOUT_ROW_SELECTABLE: '.unused-ticket-radio:not(.is-disabled)',
  // The record locator span within a ticket row ("UANDC1", "UAMCO2", "UATKT4"). Its middle letters
  // carry the ticket type, which is how a ticket is addressed - matching the whole row instead
  // would let a ticket number or a fare digit satisfy a type match.
  UNUSED_TICKETS_RECORD_LOCATOR: '.record-locator',
  // The single action button under the ticket list, matched structurally: the component carries a
  // data-testid of "...apply-btn" in source but it does not reach the rendered DOM on every build,
  // and its label swaps between "Calculate" and "Apply", so neither is safe to select on.
  UNUSED_TICKETS_ACTION_BTN: '.calculation-results button',
  // Same reason as the action button: matched by class, not by the source data-testid.
  UNUSED_TICKETS_APPLIED_CONFIRMATION: '.unused-ticket-applied',
  // Skeleton rows shown while the calculation round-trip is in flight.
  UNUSED_TICKETS_CALCULATION_SKELETON: '.skeletons',

  // Element Plus dialog close button (visible only)
  DIALOG_CLOSE_BTN: '.el-dialog__headerbtn:visible',
};

const DEFAULT_TIMEOUT = 30000;

class UnusedTicketsPage {
  constructor(page) {
    this.page = page;
  }

  getBanner() {
    return this.page.locator(SELECTORS.UNUSED_TICKETS_BANNER);
  }

  getFilter() {
    return this.page.locator(SELECTORS.UNUSED_TICKETS_FILTER);
  }

  async clickUnusedTicketsIconOnSearch({ timeout = DEFAULT_TIMEOUT } = {}) {
    const icon = this.page.locator(SELECTORS.UNUSED_TICKETS_BTN_SEARCH).first();
    await icon.waitFor({ state: 'visible', timeout });
    await icon.click();
  }

  async clickUnusedTicketsIconOnResults({ timeout = DEFAULT_TIMEOUT } = {}) {
    const icon = this.page.locator(SELECTORS.UNUSED_TICKETS_ICON_RESULTS).first();
    await icon.waitFor({ state: 'visible', timeout });
    await icon.click();
  }

  async isResultsUnusedTicketsIconVisible({ timeout = DEFAULT_TIMEOUT } = {}) {
    try {
      await this.page.locator(SELECTORS.UNUSED_TICKETS_ICON_RESULTS).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitForUnusedTicketsModal({ timeout = DEFAULT_TIMEOUT } = {}) {
    await this.page.locator(SELECTORS.UNUSED_TICKETS_CONTAINER).last().waitFor({ state: 'visible', timeout });
  }

  async getUnusedTicketsModalContent({ timeout = DEFAULT_TIMEOUT } = {}) {
    const container = this.page.locator(SELECTORS.UNUSED_TICKETS_CONTAINER).last();
    await container.waitFor({ state: 'visible', timeout });
    return container.innerText();
  }

  async clickViewDetailsOnBanner({ timeout = DEFAULT_TIMEOUT } = {}) {
    const viewDetails = this.page.locator(SELECTORS.UNUSED_TICKETS_VIEW_DETAILS).first();
    await viewDetails.waitFor({ state: 'visible', timeout });
    await viewDetails.click();
  }

  async checkUnusedTicketCheckboxOnCheckout({ timeout = DEFAULT_TIMEOUT } = {}) {
    const checkbox = this.page.locator(SELECTORS.UNUSED_TICKETS_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout });
    await checkbox.click();
  }

  async getCheckoutUnusedTicketsContent({ timeout = DEFAULT_TIMEOUT } = {}) {
    const section = this.page.locator(SELECTORS.UNUSED_TICKETS_CHECKOUT_SECTION).first();
    await section.waitFor({ state: 'visible', timeout });
    return section.innerText();
  }

  getCheckoutTicketLayout() {
    return this.page.locator(SELECTORS.UNUSED_TICKETS_CHECKOUT_LAYOUT).first();
  }

  getCheckoutTicketRows() {
    return this.getCheckoutTicketLayout().locator(SELECTORS.UNUSED_TICKETS_CHECKOUT_ROW);
  }

  getCheckoutTicketRowsByRecordLocator(text) {
    return this.getCheckoutTicketRows().filter({ has: this.getRecordLocatorMatching(text) });
  }

  getSelectableCheckoutTicketRowsByRecordLocator(text) {
    return this.getCheckoutTicketLayout()
      .locator(SELECTORS.UNUSED_TICKETS_CHECKOUT_ROW_SELECTABLE)
      .filter({ has: this.getRecordLocatorMatching(text) });
  }

  getRecordLocatorMatching(text) {
    return this.page.locator(SELECTORS.UNUSED_TICKETS_RECORD_LOCATOR, { hasText: text });
  }

  async getCheckoutRecordLocatorTexts() {
    return this.getCheckoutTicketRows().locator(SELECTORS.UNUSED_TICKETS_RECORD_LOCATOR).allInnerTexts();
  }

  getCheckoutActionButton() {
    return this.getCheckoutTicketLayout().locator(SELECTORS.UNUSED_TICKETS_ACTION_BTN).first();
  }

  getCheckoutAppliedConfirmation() {
    return this.getCheckoutTicketLayout().locator(SELECTORS.UNUSED_TICKETS_APPLIED_CONFIRMATION).first();
  }

  async waitForCheckoutTicketRows({ timeout = DEFAULT_TIMEOUT } = {}) {
    await this.getCheckoutTicketRows().first().waitFor({ state: 'visible', timeout });
  }

  async waitForCalculationToSettle({ timeout = DEFAULT_TIMEOUT } = {}) {
    await this.getCheckoutTicketLayout()
      .locator(SELECTORS.UNUSED_TICKETS_CALCULATION_SKELETON)
      .waitFor({ state: 'hidden', timeout });
  }

  async closeUnusedTicketsModal({ timeout = 10000 } = {}) {
    const dialog = this.page.locator(SELECTORS.UNUSED_TICKETS_DIALOG_ROOT).last();
    await dialog.waitFor({ state: 'visible', timeout });
    const closeBtn = dialog.locator(SELECTORS.DIALOG_HEADER_CLOSE_BTN).first();
    await closeBtn.waitFor({ state: 'visible', timeout });
    await closeBtn.click();
    await this.page.locator(SELECTORS.UNUSED_TICKETS_CONTAINER).last().waitFor({ state: 'hidden', timeout });
  }
}

module.exports = { UnusedTicketsPage, SELECTORS };
