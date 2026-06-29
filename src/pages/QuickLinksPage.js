const SELECTORS = {
  // Quick Links nav item in the sidebar (trigger for the tooltip)
  QUICK_LINK_NAV_TRIGGER: '.icon-container:has(.nav-icon.bottom-icon)',
  // Tooltip content — only visible after hovering the nav trigger
  QUICK_LINK_TOOLTIP_ROW: '.qlink-tooltip .quick-links-row',
  // app-img renders as <img class="qlink-img"> directly (no wrapper), so .qlink-img IS the img
  QUICK_LINK_TOOLTIP_IMAGE: '.qlink-tooltip img.qlink-img',
};

class QuickLinksPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async hoverQuickLinkNavItem() {
    await this.page.locator(SELECTORS.QUICK_LINK_NAV_TRIGGER).hover();
  }

  async waitForQuickLinkTooltipVisible() {
    await this.page.locator(SELECTORS.QUICK_LINK_TOOLTIP_ROW).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async getFirstQuickLinkImageSrc() {
    return this.page.locator(SELECTORS.QUICK_LINK_TOOLTIP_IMAGE).first().getAttribute('src');
  }
}

module.exports = QuickLinksPage;
