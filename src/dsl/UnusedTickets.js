const { getPageObject } = require('@utils/pageObjectCache');
const { UnusedTicketsPage } = require('@pages/UnusedTicketsPage');
const App = require('@dsl/App');
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

    // Unused-ticket data loads only on a FULL results-page load (not via in-app navigation from
    // search), with variable latency — so reload and wait for the icon, retrying a few times.
    const maxAttempts = 3;
    let iconVisible = false;
    for (let attempt = 1; attempt <= maxAttempts && !iconVisible; attempt++) {
      logger.info('Reloading results page to load unused-tickets data', { attempt, maxAttempts });
      await App.refreshPage(page);
      iconVisible = await unusedTicketsPage.isResultsUnusedTicketsIconVisible({ timeout: 30000 });
    }

    if (!iconVisible) {
      throw new Error(
        'Unused-tickets airplane icon did not appear on the results page after reloads — ' +
        'the traveler may have no unused tickets or the eligibility data failed to load.'
      );
    }

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

  async verifyUnusedTicketForCarrier(page, carrier) {
    if (!page) throw new Error('page parameter is required');
    if (!carrier || typeof carrier !== 'string') {
      throw new Error(`carrier must be a non-empty string, got: ${typeof carrier}`);
    }
    logger.info('Verifying the unused tickets list includes a ticket for carrier', { carrier });

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    const content = await unusedTicketsPage.getUnusedTicketsModalContent();

    if (!content.toLowerCase().includes(carrier.toLowerCase())) {
      throw new Error(
        `Expected the unused tickets list to include a ticket for carrier "${carrier}", ` +
        `but none was found. Modal content: "${content.substring(0, 300)}..."`
      );
    }

    logger.info('Verified: unused tickets list includes a ticket for carrier', { carrier });
    return { content };
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
