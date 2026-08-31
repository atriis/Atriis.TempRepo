const { getPageObject } = require('@utils/pageObjectCache');
const { UnusedTicketsPage } = require('@pages/UnusedTicketsPage');
const { expect } = require('@playwright/test');
const App = require('@dsl/App');
const logger = require('@utils/logger').child('UnusedTickets-DSL');

// The banner/filter render with the results list, so they are given the same budget as a results
// assertion. An absence check needs no extra budget beyond confirming the results page settled.
const PRESENCE_TIMEOUT = 15000;
const ABSENCE_TIMEOUT = 10000;

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

  async verifyCheckoutTicketWithRecordLocator(page, recordLocatorText) {
    if (!page) throw new Error('page parameter is required');
    if (!recordLocatorText || typeof recordLocatorText !== 'string') {
      throw new Error(`recordLocatorText must be a non-empty string, got: ${typeof recordLocatorText}`);
    }
    logger.info('Verifying the checkout unused tickets list offers a record locator', { recordLocatorText });

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.waitForCheckoutTicketRows();

    const matches = await unusedTicketsPage.getCheckoutTicketRowsByRecordLocator(recordLocatorText).count();
    if (matches === 0) {
      const offered = await unusedTicketsPage.getCheckoutRecordLocatorTexts();
      throw new Error(
        `Expected the checkout unused tickets list to offer a ticket whose record locator contains ` +
        `"${recordLocatorText}", but none matched. Record locators offered: ${JSON.stringify(offered)}`
      );
    }

    logger.info('Verified: checkout unused tickets list offers a matching record locator', {
      recordLocatorText,
      matches,
    });
    return { recordLocatorText, matches };
  },

  async selectCheckoutTicketByRecordLocator(page, recordLocatorText) {
    if (!page) throw new Error('page parameter is required');
    if (!recordLocatorText || typeof recordLocatorText !== 'string') {
      throw new Error(`recordLocatorText must be a non-empty string, got: ${typeof recordLocatorText}`);
    }
    logger.info('Selecting an unused ticket on checkout', { recordLocatorText });

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.waitForCheckoutTicketRows();

    const rows = unusedTicketsPage.getSelectableCheckoutTicketRowsByRecordLocator(recordLocatorText);
    const matches = await rows.count();

    if (matches === 0) {
      const offered = await unusedTicketsPage.getCheckoutRecordLocatorTexts();
      const listedButDisabled = await unusedTicketsPage
        .getCheckoutTicketRowsByRecordLocator(recordLocatorText)
        .count();
      throw new Error(
        listedButDisabled > 0
          ? `All ${listedButDisabled} unused ticket(s) whose record locator contains "${recordLocatorText}" ` +
            `are disabled on checkout, so none can be selected. Record locators offered: ${JSON.stringify(offered)}`
          : `No unused ticket on checkout has a record locator containing "${recordLocatorText}". ` +
            `Record locators offered: ${JSON.stringify(offered)}`
      );
    }

    // A record locator carries the ticket type in its middle letters (UANDC1, UAMCO2, UATKT4), so
    // addressing a ticket that way keeps the step usable on any account - ticket numbers differ per
    // account, record locator types do not. An account can hold several tickets of one type and any
    // of them exercises that type equally, so one of the matches is taken at random rather than
    // always the first, which would leave the others permanently untested.
    const selectedIndex = Math.floor(Math.random() * matches);
    const row = rows.nth(selectedIndex);
    const selectedTicket = (await row.innerText()).replace(/\s+/g, ' ').trim();

    logger.info('Selecting an unused ticket from the matching options', {
      recordLocatorText,
      matches,
      selectedIndex,
      selectedTicket,
    });

    await row.click();
    await expect(
      row,
      `The unused ticket whose record locator contains "${recordLocatorText}" should be selected on checkout`
    ).toHaveClass(/is-checked/, { timeout: PRESENCE_TIMEOUT });

    logger.info('Selected unused ticket on checkout', { recordLocatorText, selectedTicket });
    return { recordLocatorText, matches, selectedIndex, selectedTicket };
  },

  async verifyCheckoutActionButtonLabel(page, expectedLabel) {
    if (!page) throw new Error('page parameter is required');
    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error(`expectedLabel must be a non-empty string, got: ${typeof expectedLabel}`);
    }
    logger.info('Verifying the checkout unused tickets action button label', { expectedLabel });

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    const button = unusedTicketsPage.getCheckoutActionButton();

    await expect(button, 'The unused tickets action button should be visible on checkout')
      .toBeVisible({ timeout: PRESENCE_TIMEOUT });
    await expect(button, `The unused tickets action button should read "${expectedLabel}"`)
      .toContainText(expectedLabel, { timeout: PRESENCE_TIMEOUT });

    logger.info('Verified: checkout unused tickets action button label', { expectedLabel });
  },

  async applySelectedCheckoutTicket(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Applying the selected unused ticket on checkout');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    const button = unusedTicketsPage.getCheckoutActionButton();

    await expect(button, 'The unused tickets action button should be enabled before applying')
      .toBeEnabled({ timeout: PRESENCE_TIMEOUT });
    await button.click();

    await unusedTicketsPage.waitForCalculationToSettle();
    await expect(
      unusedTicketsPage.getCheckoutAppliedConfirmation(),
      'The unused ticket credit confirmation should be displayed after applying'
    ).toBeVisible({ timeout: PRESENCE_TIMEOUT });

    logger.info('Applied the selected unused ticket on checkout');
  },

  async closeUnusedTicketsModal(page) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Closing unused tickets modal');

    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await unusedTicketsPage.closeUnusedTicketsModal();
  },

  async verifyBannerVisible(page, { timeout = PRESENCE_TIMEOUT } = {}) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Verifying the unused tickets banner is visible in results', { timeout });
    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await expect(unusedTicketsPage.getBanner(), 'Unused tickets banner should be visible in results').toBeVisible({ timeout });
  },

  async verifyBannerNotVisible(page, { timeout = ABSENCE_TIMEOUT } = {}) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Verifying the unused tickets banner is NOT visible in results', { timeout });
    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await expect(unusedTicketsPage.getBanner(), 'Unused tickets banner should not be visible in results').not.toBeVisible({ timeout });
  },

  async verifyFilterVisible(page, { timeout = PRESENCE_TIMEOUT } = {}) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Verifying the unused tickets filter is visible in results', { timeout });
    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await expect(unusedTicketsPage.getFilter(), 'Unused Tickets Available filter should be visible in results').toBeVisible({ timeout });
  },

  async verifyFilterNotVisible(page, { timeout = ABSENCE_TIMEOUT } = {}) {
    if (!page) throw new Error('page parameter is required');
    logger.info('Verifying the unused tickets filter is NOT visible in results', { timeout });
    const unusedTicketsPage = getPageObject(page, UnusedTicketsPage);
    await expect(unusedTicketsPage.getFilter(), 'Unused Tickets Available filter should not be visible in results').not.toBeVisible({ timeout });
  },
};

module.exports = UnusedTickets;
