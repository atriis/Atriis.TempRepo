const SELECTORS = {
  // Unused tickets icon - search page (airplane_ticket span next to traveler name in trip-traveler-tag)
  UNUSED_TICKETS_BTN_SEARCH: '.unused-tickets-btn',

  // Unused tickets icon - results page header (next to traveler initials)
  UNUSED_TICKETS_ICON_RESULTS: '.unused-ticket-container .unused-tickets-icon.is-clickable',

  // Unused tickets modal/dialog
  UNUSED_TICKETS_DIALOG: '.app-dialog .app-unused-tickets',
  UNUSED_TICKETS_CONTAINER: '.app-unused-tickets .unused-tickets-container',

  // Unused tickets banner on results page
  UNUSED_TICKETS_BANNER: '.stay-safe-banner',
  UNUSED_TICKETS_VIEW_DETAILS: '.view-details-btn',

  // Checkout: stable section wrapping the unused tickets checkbox + radio list
  UNUSED_TICKETS_CHECKOUT_SECTION: '.reference-form-contact-details:has(.unused-tickets-checkbox)',
  UNUSED_TICKETS_CHECKBOX: '.unused-tickets-checkbox',

  // Element Plus dialog close button (visible only)
  DIALOG_CLOSE_BTN: '.el-dialog__headerbtn:visible',
};

const DEFAULT_TIMEOUT = 30000;

class UnusedTicketsPage {
  constructor(page) {
    this.page = page;
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

  async closeUnusedTicketsModal({ timeout = 10000 } = {}) {
    // Scope the close button to the unused-tickets dialog so we never accidentally
    // close another Element Plus dialog that may be open on the page.
    const dialog = this.page.locator(SELECTORS.UNUSED_TICKETS_DIALOG).last();
    await dialog.waitFor({ state: 'visible', timeout });
    const closeBtn = dialog.locator('.el-dialog__headerbtn').first();
    await closeBtn.waitFor({ state: 'visible', timeout });
    await closeBtn.click();
    await this.page.locator(SELECTORS.UNUSED_TICKETS_CONTAINER).last().waitFor({ state: 'hidden', timeout });
  }
}

module.exports = { UnusedTicketsPage, SELECTORS };
