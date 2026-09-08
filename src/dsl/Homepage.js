const { getPageObject } = require("@utils/pageObjectCache");
const LoginPage = require("@pages/LoginPage");
const { HomePage } = require("@pages/HomePage");
const QuickLinksPage = require("@pages/QuickLinksPage");
const ProfilePage = require("@pages/ProfilePage");
const logger = require("@utils/logger").child("Homepage");

/**
 * Document expiry warnings (AB#65307)
 *
 * The passport / visa / credit-card expiry warnings the app shows on two surfaces:
 *  - the homepage, for the signed-in traveller's own documents;
 *  - the trip search screen, for each traveller a booker has selected, naming them.
 *
 * Both surfaces are served by ONE component (document-expiry-alerts, mounted app-wide in
 * logged-in-page.vue) whose cards are located by HomePage, so both live here rather than being
 * split across two page objects that would only duplicate the same selectors.
 *
 * The whole feature sits behind the "Atriis.App.OBT.IsDocumentExpiryRemindersEnabled" flag
 * (document-expiry-alerts.ts), so with the flag off the stack never renders and every verification
 * below fails with "no warning was rendered at all" — the message says so explicitly, because that
 * is the single most likely reason for a failure here.
 */

/** Where a document expiry warning is allowed to render, matched against the page URL. */
const DOCUMENT_EXPIRY_SURFACES = {
  homepage: {
    label: "homepage",
    urlPattern: /\/home(?:[/?#]|$)/i,
    // The traveller's own warnings are titled without a name (documentExpiry.<type>.<status>).
    hint: "The homepage shows the signed-in traveller's OWN documents, titled without a name (e.g. \"Passport expired\").",
  },
  tripSearchPage: {
    label: "trip search page",
    urlPattern: /\/trips\/\d+/i,
    // The booker's warnings always name their traveller (documentExpiry.<type>.<status>ForTraveller).
    hint: "The trip search page shows a warning per SELECTED traveller, always naming them (e.g. \"Pini Atr's passport expired\").",
  },
};

/**
 * Resolves the named surface and confirms the page is actually on it, returning the surface config.
 *
 * Every warning assertion needs this first, and for the same reason: one component serves both the
 * homepage and the trip search screen, so a card found on the wrong screen would satisfy the lookup
 * while proving nothing. Dismissing the cookie banner belongs here too — it overlays the top of
 * both surfaces, exactly where the stack renders.
 *
 * @param {import('playwright').Page} page
 * @param {'homepage'|'tripSearchPage'} surface
 * @param {string} caller - the calling method name, for the error prefix
 * @param {string} purpose - what the caller was about to do, e.g. 'looking for the "Passport expired" warning'
 * @returns {Promise<{ label: string, urlPattern: RegExp, hint: string }>}
 */
async function ensureOnDocumentExpirySurface(page, surface, caller, purpose) {
  const config = DOCUMENT_EXPIRY_SURFACES[surface];
  if (!config) {
    throw new Error(
      `[Homepage.${caller}] Unknown surface "${surface}". ` +
        `Valid surfaces: ${Object.keys(DOCUMENT_EXPIRY_SURFACES).join(", ")}.`,
    );
  }

  await getPageObject(page, LoginPage).acceptCookiesIfPresent(5000);

  try {
    await page.waitForURL(config.urlPattern, { timeout: 30000 });
  } catch {
    throw new Error(
      `[Homepage.${caller}] Expected to be on the ${config.label} (URL matching ${config.urlPattern}) ` +
        `before ${purpose}, but the page is on ${page.url()}. The step order is wrong, or the previous ` +
        "navigation never completed.",
    );
  }

  return config;
}

/**
 * Homepage DSL
 *
 * High-level actions the user performs on the application homepage
 * (upcoming-trips monitor panel, quick-link product cards, etc.).
 * Describes WHAT the user does on the homepage, not HOW the UI works.
 */
const Homepage = {
  /**
   * Opens the full Trips page by clicking the "All trips" button on the
   * homepage upcoming-trips panel.
   *
   * Confirmation strategy:
   * - Dismiss cookie banner (can overlay homepage controls)
   * - Start waiting for the /trips navigation BEFORE the click to avoid a race
   *   where waitForURL resolves against the already-loaded homepage
   *
   * @param {import('playwright').Page} page
   */
  async clickAllTripsFromHomepage(page) {
    if (!page) throw new Error('[Homepage.clickAllTripsFromHomepage] page is required');
    logger.info('Clicking the "All trips" button on the homepage to open the trips page');

    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);

    try {
      // Cookie consent banner can re-appear on the post-login homepage and
      // intercept pointer events — dismiss before clicking.
      await loginPage.acceptCookiesIfPresent(5000);

      await Promise.all([
        // The homepage button lands on /trips?myTripsOnly=true, so allow a
        // trailing query string (a bare "**/trips" glob would not match it).
        page.waitForURL("**/trips**", { timeout: 30000 }),
        homePage.clickAllTripsButton(),
      ]);
    } catch (err) {
      throw new Error(
        `[Homepage.clickAllTripsFromHomepage] Failed to open the trips page from the homepage "All trips" button. The button may not be visible or the trips navigation timed out. Original: ${err.message}`
      );
    }
  },

  /**
   * Hovers the Quick Links nav item in the sidebar menu to reveal the
   * product card tooltip on the homepage.
   * @param {import('playwright').Page} page
   */
  async hoverQuickLinkProductCard(page) {
    if (!page) throw new Error('[Homepage.hoverQuickLinkProductCard] page is required');
    logger.info('Hovering over quick link nav item to reveal product card tooltip');
    try {
      const loginPage = getPageObject(page, LoginPage);
      const quickLinksPage = getPageObject(page, QuickLinksPage);
      // Cookie banner can re-appear on the post-login page and block pointer events
      await loginPage.acceptCookiesIfPresent(5000);
      await quickLinksPage.hoverQuickLinkNavItem();
      await quickLinksPage.waitForQuickLinkTooltipVisible();
    } catch (err) {
      throw new Error(
        `[Homepage.hoverQuickLinkProductCard] Failed to hover quick link nav item and reveal tooltip. Original: ${err.message}`
      );
    }
  },

  /**
   * Checks whether the "Start New Trip" button is visible on the homepage. Shown for low-product
   * users (2 products or fewer) as the primary booking entry point instead of the product carousel.
   * The business assertion (expect visible) is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>}
   */
  async isStartNewTripButtonVisible(page) {
    if (!page) throw new Error('[Homepage.isStartNewTripButtonVisible] page is required');
    logger.info('Checking the "Start New Trip" button is visible on the homepage');
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    // Cookie banner can re-appear on the post-login homepage and intercept pointer events — dismiss
    // it so it does not overlay the button and skew the visibility check.
    await loginPage.acceptCookiesIfPresent(5000);
    return homePage.isStartNewTripButtonVisible();
  },

  /**
   * Checks whether a named product's tile is visible on the homepage product carousel.
   * The business assertion (expect visible) is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} productName - e.g. "Flight", "Rail", "Transport"
   * @returns {Promise<boolean>}
   */
  async isProductVisibleOnHomepage(page, productName) {
    if (!page) throw new Error('[Homepage.isProductVisibleOnHomepage] page is required');
    if (!productName || typeof productName !== 'string') {
      throw new Error(`[Homepage.isProductVisibleOnHomepage] "productName" must be a non-empty string, got: ${typeof productName}`);
    }
    logger.info('Checking product tile is visible on the homepage', { productName });
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    // Cookie banner can re-appear on the post-login homepage and overlay the carousel — dismiss it.
    await loginPage.acceptCookiesIfPresent(5000);
    return homePage.isProductTileVisible(productName);
  },

  /**
   * Opens a product's search page from the homepage carousel.
   *
   * Routing per product:
   * - Rail: the tile is a sub-type dropdown → open it and pick the first sub-type.
   * - Directly-visible tile (first five products): click it.
   * - Otherwise: open the "more products" menu and click the entry (e.g. Parking, Manual Quote).
   *
   * Confirmation: waits for the trip URL (all products open under /trips/<id>/...).
   *
   * New-tab behaviour: booker / no-corporation users open each product in a NEW browser tab
   * (app: trip.service.createNewTrip → utilService.openNewWindow → window.open), leaving this
   * homepage tab in place; other users navigate in the same tab. Both cases are handled and the
   * page the product opened on is returned so callers can assert / act on it.
   *
   * @param {import('playwright').Page} page - the homepage tab
   * @param {string} productName
   * @returns {Promise<import('playwright').Page>} the tab the product's search page opened on
   */
  async openProductFromHomepage(page, productName) {
    if (!page) throw new Error('[Homepage.openProductFromHomepage] page is required');
    if (!productName || typeof productName !== 'string') {
      throw new Error(`[Homepage.openProductFromHomepage] "productName" must be a non-empty string, got: ${typeof productName}`);
    }
    logger.info('Opening product from the homepage', { productName });
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    const config = homePage.getProductConfig(productName);
    const context = page.context();

    try {
      // Keep the homepage focused: successive products are all opened from this same tab.
      await page.bringToFront();
      await loginPage.acceptCookiesIfPresent(5000);

      // Arm new-tab detection BEFORE the click so the booker (new tab) case is never missed.
      const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

      if (config.isRail) {
        await homePage.openRailProduct();
      } else if (await homePage.isProductTileVisible(productName, 2000)) {
        await homePage.clickProductTile(productName);
      } else {
        await homePage.openMoreProductsMenu();
        await homePage.clickMoreMenuProduct(productName);
      }

      // Every product opens a trip page under /trips/<id>/<product> (Manual Quote too). Detect
      // whichever settles first: a new tab (booker) OR same-tab navigation (non-booker), so the
      // same-tab path does not pay the full new-tab event timeout.
      const newTab = await Promise.race([
        newPagePromise,
        page.waitForURL(/\/trips\/\d+/, { timeout: 30000 }).then(() => null).catch(() => null),
      ]);
      if (newTab) {
        logger.info('Product opened in a new tab', { productName });
        await newTab.waitForURL(/\/trips\/\d+/, { timeout: 30000 });
        await newTab.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
        await getPageObject(newTab, LoginPage).acceptCookiesIfPresent(5000);
        return newTab;
      }

      // No new tab — the product opened in the current tab.
      logger.info('Product opened in the current tab', { productName });
      await page.waitForURL(/\/trips\/\d+/, { timeout: 30000 });
      return page;
    } catch (err) {
      throw new Error(
        `[Homepage.openProductFromHomepage] Failed to open the "${productName}" product from the homepage and reach its ` +
        `search page. The tile/menu may not have opened, or navigation to the trip page timed out. Original: ${err.message}`
      );
    }
  },

  /**
   * Checks whether the named product's search page is displayed after opening it.
   * Manual Quote opens a separate route (asserted by URL); every other product opens a trip tab
   * (asserted by the active el-tabs item). The business assertion is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} productName
   * @returns {Promise<boolean>}
   */
  async isSearchPageDisplayed(page, productName) {
    if (!page) throw new Error('[Homepage.isSearchPageDisplayed] page is required');
    if (!productName || typeof productName !== 'string') {
      throw new Error(`[Homepage.isSearchPageDisplayed] "productName" must be a non-empty string, got: ${typeof productName}`);
    }
    logger.info('Verifying product search page is displayed', { productName });
    const homePage = getPageObject(page, HomePage);
    const config = homePage.getProductConfig(productName);

    if (config.urlContains) {
      return page.url().includes(config.urlContains);
    }
    return homePage.isProductTabActive(config.tabId);
  },

  /**
   * Returns to the homepage and waits for the product carousel to render.
   *
   * When a product opened in a separate tab (booker flow), the homepage tab never left the
   * homepage — close the product tab and bring the homepage back to the front. Otherwise
   * (same-tab flow) click the side-nav "Home Page" link.
   *
   * @param {import('playwright').Page} page - the homepage tab
   * @param {import('playwright').Page} [productTab] - the tab a product opened on, if separate
   */
  async navigateBackToHomepage(page, productTab) {
    if (!page) throw new Error('[Homepage.navigateBackToHomepage] page is required');
    logger.info('Navigating back to the homepage');
    const homePage = getPageObject(page, HomePage);
    try {
      if (productTab && productTab !== page) {
        await productTab.close().catch(() => {});
        await page.bringToFront();
        await homePage.waitForHomepageReady();
        return;
      }
      await homePage.clickHomeNavIcon();
      await homePage.waitForHomepageReady();
    } catch (err) {
      throw new Error(
        `[Homepage.navigateBackToHomepage] Failed to return to the homepage from the current page. ` +
        `The "Home Page" side-nav link may not have been clickable or the homepage did not render. Original: ${err.message}`
      );
    }
  },

  /**
   * Checks whether the "more products" (more_horiz) button is visible on the homepage carousel.
   * Shown for users with more than five products. The business assertion is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>}
   */
  async isMoreProductsButtonVisible(page) {
    if (!page) throw new Error('[Homepage.isMoreProductsButtonVisible] page is required');
    logger.info('Checking the "more products" button is visible on the homepage');
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    await loginPage.acceptCookiesIfPresent(5000);
    return homePage.isMoreProductsButtonVisible();
  },

  /**
   * Counts the trips listed under the homepage "My upcoming trips" tab.
   *
   * Selects the upcoming-trips tab first (the trip monitor may default to another tab, e.g. when
   * the account has approvals awaiting), then counts the visible trip cards. The business assertion
   * (expect at least one trip) is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async getUpcomingTripsCount(page) {
    if (!page) throw new Error('[Homepage.getUpcomingTripsCount] page is required');
    logger.info('Counting trips under the homepage "My upcoming trips" list');
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    try {
      // Cookie banner can re-appear on the post-login homepage and intercept the tab click.
      await loginPage.acceptCookiesIfPresent(5000);
      // No upcoming-trips tab means the account has no upcoming trips — an empty list (count 0),
      // which the calling step asserts against, not a page failure.
      const tabPresent = await homePage.selectUpcomingTripsTab();
      if (!tabPresent) return 0;
      return await homePage.getVisibleTripCardCount();
    } catch (err) {
      throw new Error(
        `[Homepage.getUpcomingTripsCount] Failed to read the upcoming-trips list on the homepage. ` +
        `The trip-monitor tabs may not have rendered for this user. Original: ${err.message}`
      );
    }
  },

  /**
   * Reads the image src from the quick link product card tooltip.
   * @param {import('playwright').Page} page
   * @returns {Promise<string|null>}
   */
  async getQuickLinkCardImageSrc(page) {
    if (!page) throw new Error('[Homepage.getQuickLinkCardImageSrc] page is required');
    logger.debug('Getting quick link card image src from tooltip');
    try {
      const quickLinksPage = getPageObject(page, QuickLinksPage);
      const src = await quickLinksPage.getFirstQuickLinkImageSrc();
      logger.debug('Quick link card image src', { src: src ? src.substring(0, 60) + '...' : src });
      return src;
    } catch (err) {
      throw new Error(
        `[Homepage.getQuickLinkCardImageSrc] Failed to read image src from quick link card tooltip. Original: ${err.message}`
      );
    }
  },
  /**
   * Verifies a document expiry warning with the given title is displayed on the named surface.
   *
   * Warnings are addressed by their visible TITLE rather than by document type, because the title
   * is the only thing that separates the two surfaces the same component serves.
   *
   * @param {import('playwright').Page} page
   * @param {string} title - the warning's exact visible title, e.g. "Passport expired"
   * @param {'homepage'|'tripSearchPage'} surface
   * @returns {Promise<{ title: string, titles: string[] }>}
   */
  async verifyDocumentExpiryAlertDisplayed(page, title, surface) {
    if (!page) throw new Error("[Homepage.verifyDocumentExpiryAlertDisplayed] \"page\" is required.");
    if (!title || typeof title !== "string") {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertDisplayed] "title" must be a non-empty string, got: ${typeof title}`,
      );
    }

    const config = await ensureOnDocumentExpirySurface(
      page,
      surface,
      "verifyDocumentExpiryAlertDisplayed",
      `looking for the "${title}" warning`,
    );

    logger.info(`Verifying the "${title}" document expiry warning on the ${config.label}`);

    const homePage = getPageObject(page, HomePage);

    if (await homePage.isDocumentExpiryAlertVisibleByTitle(title)) {
      const titles = await homePage.getDocumentExpiryAlertTitles();
      logger.info(`"${title}" is displayed on the ${config.label}`, { titles });
      return { title, titles };
    }

    // Distinguish "no warnings at all" from "warnings, but not this one" — the two have completely
    // different causes and only the second one is about the title.
    const titles = await homePage.getDocumentExpiryAlertTitles();
    if (!titles.length) {
      throw new Error(
        "[Homepage.verifyDocumentExpiryAlertDisplayed] No document expiry warning was rendered on the " +
          `${config.label} at all (${page.url()}). Either the ` +
          "\"Atriis.App.OBT.IsDocumentExpiryRemindersEnabled\" flag is off for this corporation, or no " +
          "passport, visa or credit card on the profile(s) in scope is expired or within 60 days of " +
          `expiring. Expected: "${title}".`,
      );
    }

    throw new Error(
      `[Homepage.verifyDocumentExpiryAlertDisplayed] Expected a document expiry warning titled "${title}" ` +
        `on the ${config.label}, but the warnings present are ${JSON.stringify(titles)}. ${config.hint}`,
    );
  },

  /**
   * Verifies the surface shows exactly `expectedCount` document expiry warnings — one per affected
   * document, none merged and none missing.
   *
   * The exact count is the assertion, not a lower bound: the story requires one warning per
   * document, so two cards for a profile with three expired documents is as much a failure as four.
   * A mismatch names every title that rendered, since which one is missing is the whole diagnosis.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount
   * @param {'homepage'|'tripSearchPage'} surface
   * @returns {Promise<{ count: number, titles: string[] }>}
   */
  async verifyDocumentExpiryAlertCount(page, expectedCount, surface) {
    if (!page) throw new Error("[Homepage.verifyDocumentExpiryAlertCount] \"page\" is required.");
    if (!Number.isInteger(expectedCount) || expectedCount < 1) {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertCount] "expectedCount" must be a positive integer, got: ${JSON.stringify(expectedCount)}`,
      );
    }

    const config = await ensureOnDocumentExpirySurface(
      page,
      surface,
      "verifyDocumentExpiryAlertCount",
      "counting warnings",
    );

    logger.info(`Expecting ${expectedCount} document expiry warning(s) on the ${config.label}`);

    const homePage = getPageObject(page, HomePage);
    const count = await homePage.waitForDocumentExpiryAlertCount(expectedCount);

    if (count !== expectedCount) {
      const titles = await homePage.getDocumentExpiryAlertTitles();
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertCount] Expected ${expectedCount} document expiry warning(s) on ` +
          `the ${config.label} but found ${count}: ${JSON.stringify(titles)}. ` +
          (count === 0
            ? "With none, either the \"Atriis.App.OBT.IsDocumentExpiryRemindersEnabled\" flag is off for this " +
              "corporation, or no document on the profile(s) in scope is expired or within 60 days of expiring."
            : "document-expiry.logic.ts raises one alert per affected document — a passport, each of its visas, " +
              "and each personal credit card — so a short count means a document is not in the state the test " +
              "data assumes, and a long one means something extra on the profile also needs attention."),
      );
    }

    const titles = await homePage.getDocumentExpiryAlertTitles();
    logger.info(`${count} document expiry warning(s) on the ${config.label}`, { titles });
    return { count, titles };
  },

  /**
   * Verifies the document expiry warning with the given title carries the expected call-to-action
   * label.
   *
   * Locating by title and reading the button off that same card is what proves the pairing: the CTA
   * is derived from the document type (documentExpiry.<type>.cta), so "Credit card expired" offering
   * "Update Passport" would mean the card was built from the wrong document — invisible to a check
   * that only counted cards or only looked for titles.
   *
   * @param {import('playwright').Page} page
   * @param {string} title
   * @param {string} expectedCtaLabel - e.g. "Update Card"
   * @returns {Promise<{ ctaLabel: string }>}
   */
  async verifyDocumentExpiryAlertCta(page, title, expectedCtaLabel) {
    if (!page) throw new Error("[Homepage.verifyDocumentExpiryAlertCta] \"page\" is required.");
    if (!title || typeof title !== "string") {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertCta] "title" must be a non-empty string, got: ${typeof title}`,
      );
    }
    if (!expectedCtaLabel || typeof expectedCtaLabel !== "string") {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertCta] "expectedCtaLabel" must be a non-empty string, got: ${typeof expectedCtaLabel}`,
      );
    }

    logger.info(`Verifying the "${title}" document expiry warning offers "${expectedCtaLabel}"`);

    const homePage = getPageObject(page, HomePage);
    const ctaLabel = await homePage.getDocumentExpiryAlertCtaLabel(title);

    if (ctaLabel !== expectedCtaLabel) {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertCta] The "${title}" warning's call-to-action reads "${ctaLabel}" ` +
          `but "${expectedCtaLabel}" was expected. getCtaKey() derives the label from the document type, so ` +
          "the card was built for a different document than its title claims.",
      );
    }

    logger.info(`"${title}" offers the "${ctaLabel}" button`);
    return { ctaLabel };
  },

  /**
   * Verifies the body message of the document expiry warning with the given title, and that it
   * offers a call-to-action button. Both are read from the same card, so the message cannot be
   * satisfied by a neighbouring warning in the stack.
   *
   * @param {import('playwright').Page} page
   * @param {string} title
   * @param {string} expectedMessage
   * @returns {Promise<{ message: string, ctaLabel: string }>}
   */
  async verifyDocumentExpiryAlertMessage(page, title, expectedMessage) {
    if (!page) throw new Error("[Homepage.verifyDocumentExpiryAlertMessage] \"page\" is required.");
    if (!title || typeof title !== "string") {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertMessage] "title" must be a non-empty string, got: ${typeof title}`,
      );
    }
    if (!expectedMessage || typeof expectedMessage !== "string") {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertMessage] "expectedMessage" must be a non-empty string, got: ${typeof expectedMessage}`,
      );
    }

    logger.info(`Verifying the body of the "${title}" document expiry warning`);

    const homePage = getPageObject(page, HomePage);
    const message = await homePage.getDocumentExpiryAlertMessage(title);

    if (message !== expectedMessage) {
      throw new Error(
        `[Homepage.verifyDocumentExpiryAlertMessage] The "${title}" warning reads "${message}" but ` +
          `"${expectedMessage}" was expected. The documentExpiry.message locale string has changed, or the ` +
          "locale under test is not English.",
      );
    }

    // A card is only actionable through its CTA, which is the whole point of the warning — read it
    // here so a message-only assertion cannot pass against a card the user cannot act on.
    const ctaLabel = await homePage.getDocumentExpiryAlertCtaLabel(title);

    logger.info(`"${title}" reads "${message}" and offers the "${ctaLabel}" button`);
    return { message, ctaLabel };
  },

  /**
   * Clicks the named call-to-action button of the document expiry warning with the given title and
   * returns the page showing the affected traveller's profile.
   *
   * The CTA label is verified before the click so the feature file's "Update Passport" is a real
   * assertion rather than decoration — a visa or credit-card card in the same stack carries a
   * different label and must not be the one clicked.
   *
   * document-expiry-alert.ts routes through utilService.openNewWindow, which opens a new tab on
   * desktop and navigates in place on mobile; both are handled, and the returned page is whichever
   * one holds the profile.
   *
   * @param {import('playwright').Page} page
   * @param {string} ctaLabel - e.g. "Update Passport"
   * @param {string} title - e.g. "Pini Atr's passport expired"
   * @returns {Promise<import('playwright').Page>}
   */
  async openProfileFromDocumentExpiryAlert(page, ctaLabel, title) {
    if (!page) throw new Error("[Homepage.openProfileFromDocumentExpiryAlert] \"page\" is required.");
    if (!ctaLabel || typeof ctaLabel !== "string") {
      throw new Error(
        `[Homepage.openProfileFromDocumentExpiryAlert] "ctaLabel" must be a non-empty string, got: ${typeof ctaLabel}`,
      );
    }
    if (!title || typeof title !== "string") {
      throw new Error(
        `[Homepage.openProfileFromDocumentExpiryAlert] "title" must be a non-empty string, got: ${typeof title}`,
      );
    }

    logger.info(`Clicking "${ctaLabel}" on the "${title}" document expiry warning`);

    const homePage = getPageObject(page, HomePage);
    const actualLabel = await homePage.getDocumentExpiryAlertCtaLabel(title);

    if (actualLabel !== ctaLabel) {
      throw new Error(
        `[Homepage.openProfileFromDocumentExpiryAlert] The "${title}" warning's call-to-action reads ` +
          `"${actualLabel}", not "${ctaLabel}". The label is derived from the document type ` +
          "(documentExpiry.<type>.cta), so this warning is for a different document than the scenario expects.",
      );
    }

    const context = page.context();
    // Arm new-tab detection BEFORE the click so the desktop case is never missed.
    const newPagePromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);

    await homePage.clickDocumentExpiryAlertCta(title);

    const newTab = await newPagePromise;
    const targetPage = newTab || page;

    if (newTab) {
      await newTab.waitForLoadState("domcontentloaded", { timeout: 30000 });
      logger.info("The profile opened in a new tab");
    } else {
      // No new tab is only legitimate on the mobile branch of utilService.openNewWindow, which
      // router-pushes to /user/:userId in place. Anything else means the click never navigated.
      await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
      if (!page.url().includes("/user/")) {
        throw new Error(
          `[Homepage.openProfileFromDocumentExpiryAlert] Clicking "${ctaLabel}" did not open the profile: no ` +
            `new tab opened and the current tab is still on ${page.url()}. The click was swallowed, or the ` +
            "alert carried no userId so the resolved route went nowhere.",
        );
      }
      logger.info("The profile rendered in the same tab (mobile branch)");
    }

    try {
      await getPageObject(targetPage, ProfilePage).waitForUserProfilePage();
    } catch (err) {
      throw new Error(
        `[Homepage.openProfileFromDocumentExpiryAlert] "${ctaLabel}" opened ${targetPage.url()} but the user ` +
          `profile did not render there. Original: ${err.message}`,
      );
    }

    return targetPage;
  },
};

module.exports = Homepage;
