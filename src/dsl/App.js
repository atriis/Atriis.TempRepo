const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { launchBrowser } = require("@utils/browserFactory");
const LoginPage = require("@pages/LoginPage");
const LogoutPage = require("@pages/LogoutPage");
const { MenuPage } = require("@pages/MenuPage");
const { CommonPage } = require("@pages/CommonPage");
const config = require("@config/config");
const logger = require("@utils/logger").child("App");

/**
 * App (Application Facade)
 *
 * This file contains actions that span multiple pages/screens.
 * It represents "what the user does in the application", like:
 * - log in
 * - open a new trip (new tab)
 * - log out
 *
 * These are not single UI clicks; they are complete workflows.
 */

/**
 * Fills the login form and submits it, stopping there.
 *
 * Shared by the happy path (performLogin) and the negative path
 * (App.attemptLoginWithInvalidCredentials) — the two differ only in what they wait for
 * afterwards, so everything up to the submit lives here.
 */
async function submitLoginForm(page, email) {
  if (!page) {
    throw new Error('page is required');
  }

  if (!email || typeof email !== 'string') {
    throw new Error('email must be a non-empty string, got: ' + typeof email);
  }

  const loginPage = getPageObject(page, LoginPage);

  await loginPage.waitForLoginPage();
  // Cookie consent banner may overlay the login form — dismiss if present.
  await loginPage.acceptCookiesIfPresent();
  await loginPage.fillEmail(email);
  await loginPage.fillPassword(config.password);
  await loginPage.clickLoginButton();
}

/**
 * Helper function to perform login on an existing page.
 * - Waits for the login form
 * - Fills email and password
 * - Submits
 * - Waits until the menu shows the logout icon (meaning login worked)
 */
async function performLogin(page, email) {
  await submitLoginForm(page, email);

  const loginPage = getPageObject(page, LoginPage);
  const menuPage = getPageObject(page, MenuPage);

  // Keep as-is: app needs time to finish authentication and loading
  await page.waitForLoadState("networkidle", { timeout: 60000 });

  // Banner may re-appear on the post-login domain — dismiss if present.
  await loginPage.acceptCookiesIfPresent();

  await menuPage.waitForLogoutIcon();
}

async function createSession(email) {
  const { browser, context, page } = await App.createBrowserSession();
  await page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await performLogin(page, email);
  return { browser, context, page };
}

const App = {
  /**
   * Creates a browser session (browser + context + page) without navigating or logging in.
   * Use this when you need this.page assigned before the login attempt, so that
   * failures during login still produce a screenshot in the After hook.
   */
  async createBrowserSession() {
    const browser = await launchBrowser();
    const context = await browser.newContext({
      viewport: config.viewport,
      screen: config.viewport,
      ignoreHTTPSErrors: true,
      // Grant clipboard access so features that copy via navigator.clipboard.write
      // (the share dialog's "Copy to clipboard" action) reach their success state
      // instead of rejecting with NotAllowedError. Without it, headless Chromium
      // denies the write, the app's catch fires an ERROR alert, and the success
      // toast the test waits for never appears. Additive — no effect elsewhere.
      permissions: ["clipboard-read", "clipboard-write"],
    });

    // In CI, record a Playwright trace for the whole session (covers login, the
    // new-trip tab, and every step). The After hook exports it on failure so we
    // can see exactly which step got stuck instead of guessing from a screenshot.
    //
    // Low fidelity on purpose: snapshots give the interactive DOM time-travel
    // that makes a trace worth keeping. screenshots (a rasterized image on EVERY
    // action) and sources are dropped — with 4 parallel Chromiums on the 2-vCPU
    // runner, per-action rasterization starved actionability waits and caused
    // random step timeouts. The per-scenario failure screenshot lives in the
    // After hook (this.page.screenshot), independent of the trace.
    if (process.env.CI) {
      await context.tracing.start({ screenshots: false, snapshots: true, sources: false });
    }

    const page = await context.newPage();
    return { browser, context, page };
  },

  /**
   * Navigates to the app and logs in on an already-open page.
   *
   * @param {import('playwright').Page} page
   * @param {string} email
   */
  async login(page, email) {
    if (!page) throw new Error('page is required');
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
    await performLogin(page, email);
  },

  /**
   * Submits the login form and returns WITHOUT waiting for an authenticated session.
   *
   * Use this for negative login tests only. The happy path (App.login) ends by waiting for
   * the menu's logout icon, which can never appear for rejected credentials — that wait
   * would burn the step budget and fail with an opaque timeout instead of the real reason.
   * Verifying the rejection is left to the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} email - An email that is expected to be rejected
   */
  async attemptLoginWithInvalidCredentials(page, email) {
    if (!page) throw new Error('page is required');
    if (!email || typeof email !== 'string') {
      throw new Error('email must be a non-empty string, got: ' + typeof email);
    }

    logger.debug('Attempting login with credentials expected to be rejected', { email });

    try {
      await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
      await submitLoginForm(page, email);
    } catch (error) {
      throw new Error(
        `[App.attemptLoginWithInvalidCredentials] Could not submit the login form as "${email}" ` +
        `at ${config.baseUrl}. The login page may not have loaded or the form fields moved. ` +
        `Original: ${error.message}`
      );
    }
  },

  /**
   * Submits valid credentials for a two-factor-enabled user and returns once the verification
   * code screen is ready to accept a code.
   *
   * Kept separate from App.login: that flow ends by waiting for the menu's logout icon, which
   * never appears for a 2FA user because authentication stops at the code prompt — that wait
   * would burn the step budget and fail with an opaque timeout instead of the real reason.
   *
   * @param {import('playwright').Page} page
   * @param {string} email - A user with two-factor authentication enabled
   */
  async loginTriggeringTwoFactor(page, email) {
    if (!page) throw new Error('page is required');
    if (!email || typeof email !== 'string') {
      throw new Error('email must be a non-empty string, got: ' + typeof email);
    }

    logger.debug('Logging in with a two-factor-enabled user', { email });

    try {
      await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
      await submitLoginForm(page, email);
    } catch (error) {
      throw new Error(
        `[App.loginTriggeringTwoFactor] Could not submit the login form as "${email}" at ` +
        `${config.baseUrl}. The login page may not have loaded or the form fields moved. ` +
        `Original: ${error.message}`
      );
    }
  },

  /**
   * Waits for the two-factor verification code prompt to be displayed.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{displayed: boolean}>} Resolves once the code prompt is visible
   */
  async waitForTwoFactorPromptDisplayed(page) {
    if (!page) {
      throw new Error('page is required');
    }

    logger.debug('Waiting for the two-factor verification code prompt');

    try {
      const loginPage = getPageObject(page, LoginPage);
      await loginPage.waitForVerificationCodeField();
      return { displayed: true };
    } catch (error) {
      throw new Error(
        `[App.waitForTwoFactorPromptDisplayed] The two-factor verification code prompt was not ` +
        `displayed after signing in. The account may not have two-factor authentication enabled. ` +
        `Original: ${error.message}`
      );
    }
  },

  /**
   * Submits a deliberately wrong code on the two-factor screen.
   *
   * The code is derived from the attempt number so every attempt sends a different one: reusing
   * one value would leave the test unable to tell a fresh rejection from an unchanged form. The
   * digit that varies comes FIRST, so the codes stay distinct even if the field truncates the
   * input to a shorter maximum length.
   *
   * @param {import('playwright').Page} page
   * @param {number} attemptNumber - 1-based attempt counter, used to build a unique wrong code
   * @returns {Promise<{code: string}>} The code that was submitted
   */
  async enterIncorrectVerificationCode(page, attemptNumber) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
      throw new Error('attemptNumber must be an integer >= 1, got: ' + attemptNumber);
    }

    const code = `${attemptNumber}00000`;

    logger.debug('Submitting an incorrect verification code', { attemptNumber, code });

    try {
      const loginPage = getPageObject(page, LoginPage);
      await loginPage.fillVerificationCode(code);
      await loginPage.clickVerificationSubmitButton();
      return { code };
    } catch (error) {
      throw new Error(
        `[App.enterIncorrectVerificationCode] Could not submit the verification code "${code}" ` +
        `(attempt ${attemptNumber}). The two-factor screen may have already been left — for ` +
        `example after the attempt limit locked the user out. Original: ${error.message}`
      );
    }
  },

  /**
   * Reads the validation message shown on the two-factor screen after a code is rejected.
   * Serves both the "incorrect or expired" error and the final-attempt warning — they render in
   * the same element. The expected wording is asserted by the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - The wording the step expects, used to wait for it
   * @returns {Promise<string>} The normalized message actually displayed
   */
  async getVerificationCodeMessage(page, expectedMessage) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error('expectedMessage must be a non-empty string, got: ' + typeof expectedMessage);
    }

    logger.debug('Reading the two-factor validation message', { expectedMessage });

    try {
      const loginPage = getPageObject(page, LoginPage);
      return await loginPage.getVerificationMessage(expectedMessage);
    } catch (error) {
      throw new Error(
        `[App.getVerificationCodeMessage] Could not read the two-factor validation message while ` +
        `waiting for "${expectedMessage}". The submitted code may have been accepted, or the ` +
        `screen already returned to the login page. Original: ${error.message}`
      );
    }
  },

  /**
   * Reads the login screen's subtitle. Used to confirm the user is back on the login page.
   * The expected wording is asserted by the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedSubtitle - The wording the step expects, used to wait for it
   * @returns {Promise<string>} The normalized subtitle actually displayed
   */
  async getLoginPageSubtitle(page, expectedSubtitle) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!expectedSubtitle || typeof expectedSubtitle !== 'string') {
      throw new Error('expectedSubtitle must be a non-empty string, got: ' + typeof expectedSubtitle);
    }

    logger.debug('Reading the login page subtitle', { expectedSubtitle });

    try {
      const loginPage = getPageObject(page, LoginPage);
      return await loginPage.getLoginSubtitle(expectedSubtitle);
    } catch (error) {
      throw new Error(
        `[App.getLoginPageSubtitle] Could not read the login page subtitle while waiting for ` +
        `"${expectedSubtitle}". The login screen may not be displayed. Original: ${error.message}`
      );
    }
  },

  /**
   * Reads the login failure message shown after a rejected sign-in attempt.
   * The expected wording is asserted by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The normalized error text
   */
  async getLoginErrorMessage(page) {
    if (!page) throw new Error('page is required');

    logger.debug('Reading the login failure message');

    try {
      const loginPage = getPageObject(page, LoginPage);
      return await loginPage.getLoginErrorMessage();
    } catch (error) {
      throw new Error(
        `[App.getLoginErrorMessage] Could not read the login failure message after a rejected ` +
        `sign-in attempt. Original: ${error.message}`
      );
    }
  },

  /**
   * Logs in using an email address directly.
   *
   * @param {string} email - e.g. 'ruimariano@amadeus.com'
   */
  async loginAsUser(email) {
    logger.info(`Logging in as "${email}"`);
    return createSession(email);
  },

  /**
   * Logs in using an email address, then starts a new trip.
   *
   * @param {string} email - e.g. 'ruimariano@amadeus.com'
   */
  async loginAsUserAndBookANewTrip(email) {
    logger.info(`Logging in as "${email}"`);
    const session = await createSession(email);
    const newTripPage = await App.bookANewTrip(session.page);
    return { ...session, page: newTripPage };
  },

  /**
   * Opens the "Book a New Trip" flow.
   * Tries to catch a new tab; if no new tab opens within 10s,
   * assumes the trip opened in the current tab and returns it.
   */
  async bookANewTrip(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const menuPage = getPageObject(page, MenuPage);
    const loginPage = getPageObject(page, LoginPage);

    // Cookie consent banner can appear on the post-login domain after a short
    // delay and overlays the "Book a New Trip" icon. Dismiss before clicking.
    await loginPage.acceptCookiesIfPresent(8000);

    await menuPage.waitForBookANewTripIcon();

    const context = page.context();
    if (!context) {
      throw new Error('Page context is null or undefined');
    }

    // Try to detect a new tab opening; fall back to same tab if none opens
    const newPagePromise = context.waitForEvent("page", { timeout: 10000 }).catch(() => null);
    await menuPage.clickBookANewTrip();

    const newTripPage = await newPagePromise;

    if (newTripPage) {
      logger.info("New trip opened in a new tab");
      await newTripPage.waitForLoadState("networkidle", { timeout: 60000 });
      const newTripLoginPage = getPageObject(newTripPage, LoginPage);
      await newTripLoginPage.acceptCookiesIfPresent(5000);
      return newTripPage;
    }

    // No new tab — trip opened in current tab
    logger.info("New trip opened in current tab (no new tab detected)");
    await page.waitForLoadState("networkidle", { timeout: 60000 });
    return page;
  },

  /**
   * Logs out the user and confirms we are back on the login page.
   */
  async logout(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const loginPage = getPageObject(page, LoginPage);
    const logoutPage = getPageObject(page, LogoutPage);

    await App.clickLogout(page);

    // Confirms logout message is shown
    await logoutPage.waitForLogoutSuccessMessage();

    // Confirms login screen is visible again
    await loginPage.waitForgotPasswordText();
  },

  /**
   * Clicks the logout icon and returns immediately, WITHOUT waiting for the
   * confirmation message or the login screen.
   *
   * Use this when the scenario asserts the logout confirmation itself. App.logout()
   * consumes both of those waits internally, and the confirmation page auto-redirects
   * to the login screen after a few seconds — so by the time a separate Then step ran,
   * the message would already be gone.
   *
   * @param {import('playwright').Page} page
   */
  async clickLogout(page) {
    if (!page) {
      throw new Error('page is required');
    }

    logger.debug('Clicking the logout icon without waiting for the confirmation page');

    try {
      const menuPage = getPageObject(page, MenuPage);
      await menuPage.waitForLogoutIcon();
      await menuPage.clickLogout();
    } catch (error) {
      throw new Error(
        `[App.clickLogout] Could not click the logout icon in the menu. The user may not be ` +
        `logged in, or the menu had not finished rendering. Original: ${error.message}`
      );
    }
  },

  /**
   * Reads the logout confirmation message shown right after logging out.
   * The expected wording is asserted by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The normalized confirmation text
   */
  async getLogoutSuccessMessage(page) {
    if (!page) {
      throw new Error('page is required');
    }

    logger.debug('Reading the logout confirmation message');

    try {
      const logoutPage = getPageObject(page, LogoutPage);
      return await logoutPage.getLogoutSuccessMessage();
    } catch (error) {
      throw new Error(
        `[App.getLogoutSuccessMessage] Could not read the logout confirmation message after ` +
        `logging out. Original: ${error.message}`
      );
    }
  },

  /**
   * Waits for the login screen to be shown again, as happens a few seconds after logout
   * when the confirmation page auto-redirects.
   *
   * Anchored on "Forgot password?" rather than the page heading: the login screen's heading
   * is "Welcome back", the same wording the authenticated homepage uses, so a heading check
   * could not tell the two apart.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{displayed: boolean}>} Resolves once the login screen is visible
   */
  async waitForLoginPageDisplayed(page) {
    if (!page) {
      throw new Error('page is required');
    }

    logger.debug('Waiting for the login screen to be displayed again');

    try {
      const loginPage = getPageObject(page, LoginPage);
      await loginPage.waitForgotPasswordText();
      return { displayed: true };
    } catch (error) {
      throw new Error(
        `[App.waitForLoginPageDisplayed] The login screen was not displayed again. The logout ` +
        `confirmation page may not have auto-redirected, or logout did not clear the session. ` +
        `Original: ${error.message}`
      );
    }
  },

  /**
   * Verifies a heading containing the expected text is visible.
   * Useful for localized welcome screens where the heading also includes the user name.
   */
  async isHeadingContainingTextVisible(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const commonPage = getPageObject(page, CommonPage);
    return commonPage.isHeadingContainingTextVisible(expectedText, { timeout: 30000 });
  },

  /**
   * Switches the application display language from the header language menu.
   *
   * This flow:
   * - hovers the language (globe) icon to open the language list
   * - clicks the requested language by name
   *
   * Verification of the resulting localized UI is left to the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} languageName - The language as shown in the list (e.g. "Italian", "English")
   */
  async switchLanguage(page, languageName) {
    if (!page) throw new Error('page is required');
    if (!languageName || typeof languageName !== 'string') {
      throw new Error('languageName must be a non-empty string, got: ' + typeof languageName);
    }

    logger.debug('Switching application language', { languageName });

    const menuPage = getPageObject(page, MenuPage);
    await menuPage.hoverLanguageIcon();
    await menuPage.clickLanguageOption(languageName);
  },

  /**
   * Opens the corporate expenses provider from the side navigation ("<expenseName> - Expenses").
   *
   * Clicking that entry does NOT navigate the app tab: the app calls openNewWindow(..., '_blank'),
   * so the provider is signed into in a NEW browser tab. The new tab is therefore MANDATORY here —
   * unlike bookANewTrip, a missing tab is a real failure, not a same-tab fallback — so the
   * waitForEvent is armed before the click and deliberately left un-caught.
   *
   * @param {import('playwright').Page} page - The app tab showing the side navigation
   * @param {string} expenseName - The corporate expense display name (e.g. "MESH")
   * @returns {Promise<import('playwright').Page>} The newly opened SSO provider tab
   */
  async openExpensesLinkFromSideNav(page, expenseName) {
    if (!page) throw new Error('[App.openExpensesLinkFromSideNav] page is required');
    if (!expenseName || typeof expenseName !== 'string') {
      throw new Error(`[App.openExpensesLinkFromSideNav] "expenseName" must be a non-empty string, got: ${typeof expenseName} (${JSON.stringify(expenseName)})`);
    }

    logger.debug('Opening the corporate expenses link from the side navigation', { expenseName });

    const menuPage = getPageObject(page, MenuPage);
    const loginPage = getPageObject(page, LoginPage);

    try {
      // Keep the app tab focused, and dismiss the cookie banner — it can overlay the lower
      // side-nav entries and intercept the click.
      await page.bringToFront().catch(() => {});
      await loginPage.acceptCookiesIfPresent(8000);

      const context = page.context();
      if (!context) {
        throw new Error('[App.openExpensesLinkFromSideNav] page context is null');
      }

      // Arm new-tab detection BEFORE the click, otherwise the tab can open before we listen.
      const ssoTabPromise = context.waitForEvent('page', { timeout: 20000 });
      // Keep that rejection handled. The click below can take longer than the 20s wait, so if the
      // click throws first this promise is never awaited — and an unhandled rejection would kill the
      // Cucumber worker instead of failing the step. The await further down still sees the original
      // rejection, so a missing tab remains a real failure.
      ssoTabPromise.catch(() => {});
      await menuPage.clickExpensesNavItem(expenseName);
      const ssoTab = await ssoTabPromise;

      // The provider is third-party: "domcontentloaded" is enough, and failures here are not
      // fatal — the URL assertion in verifyExpensesSsoTabOpened is what decides the outcome.
      await ssoTab.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
      logger.info('Corporate expenses SSO tab opened', { expenseName, url: ssoTab.url() });
      return ssoTab;
    } catch (err) {
      throw new Error(
        `[App.openExpensesLinkFromSideNav] Failed to open the "${expenseName} - Expenses" side-nav link and capture the ` +
        `SSO provider tab. The app opens the provider with openNewWindow(..., '_blank'), so the app tab itself never ` +
        `navigates — a missing new tab means either the side-nav entry was not clickable or the click did not trigger ` +
        `the redirect. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the expenses side-nav link actually opened the corporate expenses (SSO) provider in
   * the captured new tab, then closes that tab and returns focus to the app.
   *
   * There is nothing to compare against but the opened tab itself: the nav entry is a <div @click>
   * with no href, and the provider URL is a build-time app variable (expense.Url from the
   * per-corporation user-expense lookup, prefixed with the app's expense endpoint when relative)
   * that this framework's config does not expose. So the assertion is structural: the tab must
   * reach a real http(s) URL, and that URL must NOT be the app's own origin.
   *
   * RISK, recorded deliberately: if a deployment ever serves the expense URL from the app's OWN
   * origin, the origin assertion below fails and prints the actual URL. The correct follow-up is
   * then to WEAKEN that check (e.g. assert the tab is not an OBT SPA route) — never to hardcode the
   * provider host, and never to delete the assertion: the Testim source this test came from had no
   * assertions at all, and this check is the entire point of the test.
   *
   * @param {import('playwright').Page} ssoTab - The tab captured when the expenses link was clicked
   * @param {import('playwright').Page} appPage - The app tab; its origin is what the opened tab is
   *   compared against, and it is refocused afterwards. Required — see below.
   * @param {string} [expenseName] - The corporate expense display name, for the failure message
   * @returns {Promise<{url: string}>}
   */
  async verifyExpensesSsoTabOpened(ssoTab, appPage, expenseName) {
    if (!ssoTab) {
      throw new Error(
        '[App.verifyExpensesSsoTabOpened] "ssoTab" is required — no opened tab was stored. Ensure the ' +
        '"I open the ... expenses link from the side navigation" step ran first.'
      );
    }

    const label = expenseName ? `"${expenseName} - Expenses"` : 'corporate expenses';

    // The origin comparison is the only check here that can catch the expenses link opening an
    // in-app page, so it must never be silently skipped: without a resolvable app origin this
    // method would degrade to "the tab loaded something", which cannot fail. Fail loudly instead.
    if (!appPage) {
      throw new Error(
        '[App.verifyExpensesSsoTabOpened] "appPage" is required — the app tab is what the opened tab\'s ' +
        'origin is compared against, and without it this verification cannot fail.'
      );
    }

    const appUrl = appPage.url();
    let appOrigin = null;
    try {
      const parsedAppUrl = new URL(appUrl);
      if (/^https?:$/.test(parsedAppUrl.protocol)) {
        appOrigin = parsedAppUrl.origin;
      }
    } catch {
      appOrigin = null;
    }

    if (!appOrigin) {
      throw new Error(
        `[App.verifyExpensesSsoTabOpened] Could not resolve an http(s) origin for the app tab (url: "${appUrl}"). ` +
        `That origin is required for the comparison below, which is the only assertion able to catch the ${label} ` +
        `link opening an in-app page — so it must not be skipped.`
      );
    }

    logger.debug('Verifying the expenses link opened the SSO provider tab', { expenseName, appOrigin });

    let ssoUrl;
    try {
      // Poll to absorb the about:blank → provider navigation the new tab starts on.
      await expect
        .poll(() => ssoTab.url(), {
          timeout: 30000,
          message:
            `Expected the ${label} side-nav link to open the corporate expenses SSO provider in a new tab, but the ` +
            `opened tab never left about:blank for an http(s) URL.`,
        })
        .toMatch(/^https?:\/\/.+/);

      ssoUrl = ssoTab.url();

      expect(
        new URL(ssoUrl).origin,
        `Expected the ${label} link to open an EXTERNAL SSO provider page, but the new tab stayed on the app ` +
        `origin. Opened: "${ssoUrl}", app origin: "${appOrigin}". The provider URL is corporation/config ` +
        `dependent (expense.Url from the per-corporation user-expense lookup, prefixed with the app expense ` +
        `endpoint when relative) — never assert a hardcoded provider domain.`
      ).not.toBe(appOrigin);
    } finally {
      // A foreground target="_blank" tab throttles the app page and swallows the next interaction,
      // so always close it and hand focus back to the app.
      await ssoTab.close().catch(() => {});
      await appPage.bringToFront().catch(() => {});
    }

    return { url: ssoUrl };
  },

  /**
   * Reloads the current page. Centralized here so retries, post-reload
   * waits, or instrumentation can be added in one place.
   * @param {import('playwright').Page} page
   * @returns {Promise<{refreshed: true}>}
   */
  async refreshPage(page) {
    if (!page) throw new Error('page is required');
    logger.info('Refreshing current page');
    await page.reload({ waitUntil: 'load' });
    return { refreshed: true };
  },
};

module.exports = App;
