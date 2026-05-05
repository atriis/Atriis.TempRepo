const { getPageObject } = require('@utils/pageObjectCache');
const { UnusedTicketsPage } = require('@pages/UnusedTicketsPage');
const logger = require('@utils/logger');

function assertNoMco(content, where) {
  if (/MCO/i.test(content)) {
    throw new Error(
      `MCO unused tickets should be hidden ${where} but found MCO in content: "${content.substring(0, 200)}..."`
    );
  }
}

const UnusedTickets = {
  async openUnusedTicketsModalFromSearchTraveler(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Opening unused tickets modal via airplane icon next to traveler (search page)');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.clickUnusedTicketsIconOnSearch();
    await unusedTicketsPage.waitForUnusedTicketsModal();
  },

  async openUnusedTicketsModalFromResultsHeader(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Opening unused tickets modal via airplane icon in results header');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.clickUnusedTicketsIconOnResults();
    await unusedTicketsPage.waitForUnusedTicketsModal();
  },

  async openUnusedTicketsFromBannerViewDetails(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Opening unused tickets modal via "View details" link on banner');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.clickViewDetailsOnBanner();
    await unusedTicketsPage.waitForUnusedTicketsModal();
  },

  async verifyMcoUnusedTicketsHidden(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Verifying MCO unused tickets are hidden in modal');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    const content = await unusedTicketsPage.getUnusedTicketsModalContent();
    assertNoMco(content, 'in modal');

    logger.info('Verified: MCO unused tickets are not displayed in modal');
    return { content };
  },

  async checkUnusedTicketCheckboxOnCheckout(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Checking unused ticket checkbox on checkout');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.checkUnusedTicketCheckboxOnCheckout();
  },

  async verifyMcoHiddenOnCheckout(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Verifying MCO unused tickets are hidden on checkout');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    const content = await unusedTicketsPage.getCheckoutUnusedTicketsContent();
    assertNoMco(content, 'on checkout');

    logger.info('Verified: MCO unused tickets are not displayed on checkout');
    return { content };
  },

  async closeUnusedTicketsModal(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Closing unused tickets modal');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.closeUnusedTicketsModal();
  },
};

module.exports = UnusedTickets;
