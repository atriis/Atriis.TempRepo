/**
 * Page Object for Amtrak results page.
 * Contains only UI-level interactions.
 */

// Only the no-results empty state is borrowed: it is product-agnostic (app-no-results-search.vue)
// and already owned by ResultsPage. ResultsPage does not require this file, so there is no cycle.
const { SELECTORS: RESULTS_SELECTORS } = require("@pages/ResultsPage");

const SELECTORS = {
  // amtrak-list.vue renders one amtrak-preview per result, so the Nth direct child of
  // .amtrak-list is the Nth result card. Scoping the share/fare-rules controls to that card
  // keeps them apart from the identically-classed controls the share bar and the More details
  // drawer render elsewhere on the same page.
  FIRST_RESULT_CARD: '.amtrak-list > *:nth-child(1)',
  // app-share-products-btns.vue's "not yet added" branch (.share-btn.py-2 + btn--primary) and its
  // "added" branch (.share-btn.has-text-primary.py-2). Only rendered while the page is in share
  // mode, where they replace the card's Select button.
  RESULT_SHARE_BUTTON: '.share-btn.py-2',
  RESULT_SHARE_ADDED_BUTTON: '.share-btn.has-text-primary.py-2',
  // amtrak-results.vue renders the city-pair navigation only in share mode. Both the previous and
  // the next button carry .pair-btn, so the label is what separates them.
  NEXT_CITY_PAIR_BUTTON: '.city-pair-btns .pair-btn',
  NEXT_CITY_PAIR_LABEL: 'Next city pair',
  // amtrak-quote-fare-rules.vue's own .terms-link block, scoped to the .app-dialog the results page
  // opens the fare rules in. The anchor is target="_blank" on desktop and target="_self" on mobile,
  // so the attribute is what proves the desktop "opens in a new tab" behaviour.
  FARE_RULES_SUPPLIER_TERMS_LINK: '.el-dialog.app-dialog .terms-link a',
  // el-drawer copies its :title into aria-label, and amtrak-results.vue binds that title to
  // "More details" — so this addresses the drawer itself rather than the card button that opened it.
  MORE_DETAILS_DRAWER: '[aria-label="More details"]',
  // "Available Classes And Fares" heading of the Sabre classes card inside the More details drawer
  // (amtrak-more-details.vue, v-if="hasSabreResults").
  MORE_DETAILS_CLASSES_TITLE: '.classes-card .mb-4',
  // The card Select button of an amtrak-preview, excluding the ones the app renders disabled:
  // amtrak-preview.vue disables Select when isSelectRestricted (e.g. a return train that departs
  // before the outbound arrives), and those cards sort to the top of the return list, so the first
  // Select on screen is regularly one that can never be clicked.
  ENABLED_SELECT_BUTTON: '.amtrak-list button.select-rail-btn:not([disabled])',
  // amtrak-more-details.vue's footer Select button. Scoped to the drawer because the result cards
  // behind it render the same .select-rail-btn class.
  MORE_DETAILS_SELECT_BUTTON: '.app-footer .select-rail-btn',
};

class AmtrakResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the Amtrak search to settle into one of its two terminal states, whichever paints
   * first: bookable result cards, or the "No results found" empty state.
   *
   * Why this exists: clickSearchButton() returns as soon as the click lands, so without this the
   * next step races the supplier. The assertion steps then fail on their own element timeouts
   * (CommonPage.waitForOOPVisible caps at 30s) even though the Cucumber step budget is 120s — so
   * a slow-but-successful Amtrak search reads as "the OOP badge is missing" rather than "the
   * search had not finished". Mirrors ResultsPage.waitForCarResultsOrNoResults.
   *
   * Returns the outcome rather than throwing on 'no-results': deciding what an empty search means
   * is the DSL's job, and one scenario (wasToBos) legitimately expects no policy indicator.
   *
   * @param {number} [timeout=120000] - Max ms to wait for either state
   * @returns {Promise<'results'|'no-results'>}
   */
  async waitForResultsOrNoResults(timeout = 120000) {
    if (typeof timeout !== "number" || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got ${timeout}`);
    }

    const resultsPromise = this.page
      .locator(SELECTORS.FIRST_RESULT_CARD)
      .first()
      .waitFor({ state: "visible", timeout })
      .then(() => "results");

    const noResultsPromise = this.page
      .locator(RESULTS_SELECTORS.NO_RESULTS_CONTAINER)
      .first()
      .waitFor({ state: "visible", timeout })
      .then(() => "no-results");

    const winner = await Promise.race([resultsPromise, noResultsPromise]).catch(() => null);

    if (winner) {
      return winner;
    }

    throw new Error(
      "[AmtrakResultsPage.waitForResultsOrNoResults] The Amtrak search did not settle within " +
        `${timeout}ms: neither result cards (${SELECTORS.FIRST_RESULT_CARD}) nor the no-results ` +
        `state (${RESULTS_SELECTORS.NO_RESULTS_CONTAINER}) became visible. The results page is ` +
        "still loading — treat this as an environment/performance problem, not a missing element.",
    );
  }

  /**
   * Clicks the "More details" button for the first Amtrak result.
   */
  async clickMoreDetailsButton() {
    await this.page.getByRole('button', { name: 'More details' }).first().click();
  }

  /**
   * Clicks the Select button of the first selectable Amtrak result, skipping cards whose Select is
   * disabled by the app.
   */
  async clickFirstEnabledSelectButton() {
    const button = this.page.locator(SELECTORS.ENABLED_SELECT_BUTTON).first();

    try {
      await button.waitFor({ state: 'visible', timeout: 60000 });
    } catch (error) {
      throw new Error(
        `[AmtrakResultsPage.clickFirstEnabledSelectButton] No selectable Amtrak result appeared within ` +
          `60000ms (${SELECTORS.ENABLED_SELECT_BUTTON}). Every result on screen has its Select button ` +
          `disabled. Original: ${error.message}`,
      );
    }

    await button.scrollIntoViewIfNeeded();
    await button.click();
  }

  /**
   * Clicks the share ("+ Share") button on the first result card. Share mode must already be on.
   */
  async clickFirstResultShareButton() {
    const button = this.page
      .locator(`${SELECTORS.FIRST_RESULT_CARD} ${SELECTORS.RESULT_SHARE_BUTTON}`)
      .first();
    await button.waitFor({ state: 'visible', timeout: 30000 });
    await button.click();
  }

  /**
   * Waits for the first result card's share button to flip into its "Added" state, which is what
   * enables the "Next city pair" button and the share bar's email button.
   */
  async waitForFirstResultAddedToShare() {
    const added = this.page
      .locator(`${SELECTORS.FIRST_RESULT_CARD} ${SELECTORS.RESULT_SHARE_ADDED_BUTTON}`)
      .first();

    try {
      await added.waitFor({ state: 'visible', timeout: 30000 });
    } catch (error) {
      throw new Error(
        `[AmtrakResultsPage.waitForFirstResultAddedToShare] The first Amtrak result did not switch to its ` +
          `"Added" share state (${SELECTORS.FIRST_RESULT_CARD} ${SELECTORS.RESULT_SHARE_ADDED_BUTTON}) within 30000ms. ` +
          `Original: ${error.message}`,
      );
    }
  }

  /**
   * Waits for the first result card's share button to be back in its "not added" state — used after
   * moving to the next city pair, to confirm the list really re-rendered with that pair's trains.
   */
  async waitForFirstResultShareButton() {
    await this.page
      .locator(`${SELECTORS.FIRST_RESULT_CARD} ${SELECTORS.RESULT_SHARE_BUTTON}`)
      .first()
      .waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
   * Clicks the "Next city pair" button of the share-mode city-pair navigation.
   */
  async clickNextCityPairButton() {
    const button = this.page
      .locator(SELECTORS.NEXT_CITY_PAIR_BUTTON, { hasText: SELECTORS.NEXT_CITY_PAIR_LABEL })
      .first();
    await button.waitFor({ state: 'visible', timeout: 30000 });
    await button.click();
  }

  /**
   * Reads the "Supplier Terms & Conditions" link of the open fare rules dialog.
   * @returns {Promise<{text: string, target: string|null, href: string|null}>}
   */
  async getFareRulesSupplierTermsLink() {
    const link = this.page.locator(SELECTORS.FARE_RULES_SUPPLIER_TERMS_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 30000 });

    return {
      text: (await link.innerText()).trim(),
      target: await link.getAttribute('target'),
      href: await link.getAttribute('href'),
    };
  }

  /**
   * Reads the classes card heading inside the open More details drawer.
   * @returns {Promise<string>}
   */
  async getMoreDetailsClassesTitleText() {
    const title = this.page
      .locator(`${SELECTORS.MORE_DETAILS_DRAWER} ${SELECTORS.MORE_DETAILS_CLASSES_TITLE}`)
      .first();
    await title.waitFor({ state: 'visible', timeout: 60000 });
    return (await title.innerText()).trim();
  }

  /**
   * Clicks the "Select" button in the footer of the open More details drawer.
   */
  async clickMoreDetailsSelectButton() {
    const button = this.page
      .locator(`${SELECTORS.MORE_DETAILS_DRAWER} ${SELECTORS.MORE_DETAILS_SELECT_BUTTON}`)
      .first();
    await button.waitFor({ state: 'visible', timeout: 30000 });
    await button.click();
  }

  /**
   * Waits for the More details drawer to leave the screen after a selection, so the next step reads
   * the results list instead of the drawer that is still animating away.
   */
  async waitForMoreDetailsDrawerToClose() {
    const drawer = this.page.locator(SELECTORS.MORE_DETAILS_DRAWER).first();

    try {
      await drawer.waitFor({ state: 'hidden', timeout: 30000 });
    } catch (error) {
      throw new Error(
        `[AmtrakResultsPage.waitForMoreDetailsDrawerToClose] The More details drawer ` +
          `(${SELECTORS.MORE_DETAILS_DRAWER}) was still visible 30000ms after selecting the train. ` +
          `Original: ${error.message}`,
      );
    }
  }
}

module.exports = AmtrakResultsPage;
