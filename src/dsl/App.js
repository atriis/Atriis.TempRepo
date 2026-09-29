const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { launchBrowser } = require("@utils/browserFactory");
const LoginPage = require("@pages/LoginPage");
const LogoutPage = require("@pages/LogoutPage");
const { MenuPage } = require("@pages/MenuPage");
const { CommonPage } = require("@pages/CommonPage");
const config = require("@config/config");
const sessionOptions = require("@utils/sessionOptions");
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

  try {
    await menuPage.waitForLogoutIcon();
  } catch (error) {
    // An expired password is accepted but parks the session on a change-password form, which
    // otherwise surfaces only as an opaque avatar timeout.
    if (await loginPage.isPasswordExpiredScreenDisplayed()) {
      throw new Error(
        `[App.performLogin] Login as "${email}" landed on the 90-day "change your password" screen ` +
        `instead of the homepage: the account's password has expired on this environment. Rotate ` +
        `the password for "${email}" — every scenario using this user fails until it is changed. ` +
        `Original: ${error.message}`
      );
    }
    throw error;
  }
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
    // Per-scenario context overrides (currently `timezoneId`, from an @timezone:<Zone> tag).
    // Spread FIRST so nothing below can be silently overridden by a tag, and so an untagged
    // scenario - the overwhelming majority - builds a byte-identical context to before.
    const overrides = sessionOptions.get();
    if (overrides.timezoneId) {
      logger.info("Opening the browser context in an overridden timezone", { timezoneId: overrides.timezoneId });
    }

    const context = await browser.newContext({
      ...overrides,
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
   * Waits for the URL to show a trip number other than previousTripId, because right after
   * "Book a New Trip" the tab can still be on the previous trip's route.
   */
  async waitForNewTripNumberInUrl(page, previousTripId = null, { timeoutMs = 20000 } = {}) {
    if (!page) throw new Error('[App.waitForNewTripNumberInUrl] page is required');
    const commonPage = getPageObject(page, CommonPage);
    logger.debug("Waiting for a new trip number in the URL", { previousTripId });

    let tripId = null;
    await expect
      .poll(
        () => {
          tripId = commonPage.getTripNumberFromUrl();
          return Boolean(tripId) && tripId !== previousTripId;
        },
        {
          message:
            `[App.waitForNewTripNumberInUrl] No trip number other than ${previousTripId} appeared in the URL ` +
            `within ${timeoutMs}ms (current URL: ${page.url()}). The new trip page may not have opened.`,
          timeout: timeoutMs,
        }
      )
      .toBe(true);
    return { tripId, previousTripId };
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
   * Verifies the corporate expenses entry is present in the side navigation, labelled exactly
   * "<expenseName> - Expenses".
   *
   * Read-only: it does NOT click, so it can run before the open step in the same scenario.
   * The entry is rendered only once the async per-corporation user-expense lookup resolves
   * (and only on desktop viewports), hence the long visibility wait.
   *
   * @param {import('playwright').Page} page - The app tab showing the side navigation
   * @param {string} expenseName - The corporate expense display name (e.g. "MESH")
   * @returns {Promise<{label: string}>}
   */
  async verifyExpensesLinkDisplayedInSideNav(page, expenseName) {
    if (!page) throw new Error('[App.verifyExpensesLinkDisplayedInSideNav] page is required');
    if (!expenseName || typeof expenseName !== 'string') {
      throw new Error(`[App.verifyExpensesLinkDisplayedInSideNav] "expenseName" must be a non-empty string, got: ${typeof expenseName} (${JSON.stringify(expenseName)})`);
    }

    const expectedLabel = `${expenseName} - Expenses`;
    logger.debug('Verifying the corporate expenses link is displayed in the side navigation', { expenseName });

    const menuPage = getPageObject(page, MenuPage);
    const label = menuPage.getExpensesNavItemLabel(expenseName);

    await expect(
      label,
      `Expected the side navigation to show the "${expectedLabel}" entry, but it never became visible. ` +
      `That entry renders only when BOTH an expense display name and an expense URL come back from the ` +
      `per-corporation user-expense lookup (getUserExpense), and only on desktop viewports — so this can ` +
      `mean this user's corporation has no expenses provider configured rather than a broken selector.`
    ).toBeVisible({ timeout: 30000 });

    // Exact text, not a substring: the display name is what the corporation configured, and a
    // partial match would pass on a differently-named provider that happens to contain it.
    await expect(
      label,
      `Expected the expenses side-nav entry to read exactly "${expectedLabel}". The label is ` +
      `"<expenseDisplayName> - <translated 'Expenses'>", so a mismatch means either a different ` +
      `display name for this corporation or a non-English display language on the profile.`
    ).toHaveText(expectedLabel, { timeout: 15000 });

    return { label: expectedLabel };
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
   * @returns {Promise<{ssoTab: import('playwright').Page, requestedUrl: string|null}>} The newly
   *   opened SSO provider tab, plus the URL the app actually asked the browser to open
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

      // Record what the app asks the browser to open, BEFORE the click. The nav entry is a bare
      // <div @click="expenseRedirect"> with no href, and on desktop the app reaches the provider
      // through utilService.openNewWindow -> window.open(expense.Url, '_blank') — so this hook is
      // the ONLY place the configured URL is observable verbatim. The opened tab's own url() is
      // not a substitute: a provider that is unreachable or that redirects leaves the tab on
      // chrome-error://chromewebdata/ or on a post-redirect URL, neither of which is the
      // configured value. Patching at call time is safe because openNewWindow resolves
      // window.open on every call rather than capturing it at module load.
      await page.evaluate(() => {
        if (window.__atriisOpenedUrls) return;
        window.__atriisOpenedUrls = [];
        const nativeOpen = window.open;
        window.open = function (url, ...rest) {
          window.__atriisOpenedUrls.push(url === undefined || url === null ? '' : String(url));
          return nativeOpen.call(window, url, ...rest);
        };
      });

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

      // Read the hook back after the click. Left null rather than defaulted when nothing was
      // recorded, so verifyExpensesTabUrl fails loudly instead of comparing against a placeholder.
      const openedUrls = await page.evaluate(() => window.__atriisOpenedUrls || []).catch(() => []);
      const requestedUrl = openedUrls.length ? openedUrls[openedUrls.length - 1] : null;

      logger.info('Corporate expenses SSO tab opened', { expenseName, requestedUrl, url: ssoTab.url() });
      return { ssoTab, requestedUrl };
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
   * Verifies the expenses side-nav link opened a new tab targeting an EXACT expected URL, then
   * closes that tab and returns focus to the app.
   *
   * Use this instead of verifyExpensesSsoTabOpened when the scenario knows the expenses URL that
   * the corporation is configured with. The two are deliberately separate: verifyExpensesSsoTabOpened
   * asserts only that the tab left the app's own origin (the right check when the provider URL is
   * unknown), and that structural check would FAIL for an expenses URL served from the app origin,
   * which an exact expected URL is free to be.
   *
   * WHAT IS COMPARED: the URL the app asked the browser to open (the window.open target recorded by
   * openExpensesLinkFromSideNav) — NOT the URL the opened tab settles on. Those differ whenever the
   * configured provider is unreachable or redirects: staging's "vvv" corporation is configured with
   * https://abc, which resolves to nothing, so the tab settles on chrome-error://chromewebdata/ and
   * an assertion on the settled URL can never pass even though the app behaved correctly. The
   * requested URL is also the stricter signal — it is the configured value verbatim, before any
   * provider-side redirect or session parameters are appended.
   *
   * The tab is still required: this asserts the link genuinely opened one, not merely that the app
   * computed a URL. The tab's settled URL is logged for diagnosis but never asserted on.
   *
   * The comparison is exact string equality, so if a run ever fails with only extra query
   * parameters, the fix is to loosen this to a prefix check — never to drop the assertion.
   *
   * @param {import('playwright').Page} ssoTab - The tab captured when the expenses link was clicked
   * @param {import('playwright').Page} appPage - The app tab; refocused after the assertion
   * @param {string} expectedUrl - The exact URL the link must open, scheme included
   * @param {string} requestedUrl - The window.open target recorded at click time
   * @returns {Promise<{url: string, settledUrl: string}>}
   */
  async verifyExpensesTabUrl(ssoTab, appPage, expectedUrl, requestedUrl) {
    if (!ssoTab) {
      throw new Error(
        '[App.verifyExpensesTabUrl] "ssoTab" is required — no opened tab was stored. Ensure the ' +
        '"I open the ... expenses link from the side navigation" step ran first.'
      );
    }
    if (!appPage) {
      throw new Error('[App.verifyExpensesTabUrl] "appPage" is required — it is refocused after the assertion.');
    }
    if (!expectedUrl || typeof expectedUrl !== 'string') {
      throw new Error(`[App.verifyExpensesTabUrl] "expectedUrl" must be a non-empty string, got: ${typeof expectedUrl} (${JSON.stringify(expectedUrl)})`);
    }

    logger.debug('Verifying the URL of the tab opened by the expenses link', { expectedUrl, requestedUrl });

    const settledUrl = ssoTab.url();
    try {
      if (!requestedUrl || typeof requestedUrl !== 'string') {
        throw new Error(
          `[App.verifyExpensesTabUrl] No window.open target was recorded for the expenses link, so the ` +
          `configured URL cannot be read. On desktop the app reaches the provider through ` +
          `utilService.openNewWindow -> window.open, so an empty recording means the click took the mobile ` +
          `router.push branch (check the viewport) or the window.open hook was installed after the click. ` +
          `The tab that did open settled on "${settledUrl}".`
        );
      }

      // Thrown rather than expect(value, message): this repo's @playwright/test silently discards
      // expect's custom message, and the bare "expected/received" diff would not say that the value
      // compared is corporation config rather than anything the test controls.
      if (requestedUrl !== expectedUrl) {
        throw new Error(
          `[App.verifyExpensesTabUrl] Expected the expenses link to open exactly "${expectedUrl}", but the ` +
          `app asked the browser to open "${requestedUrl}". That value is corporation config (expense.Url ` +
          `from the per-corporation user-expense lookup, prefixed with the app's expense endpoint only when ` +
          `it has no http(s) scheme), so a mismatch means this corporation is configured with a different ` +
          `URL — check the expenses provider on the corporation rather than the selector. The opened tab ` +
          `settled on "${settledUrl}" (not asserted on: an unreachable or redirecting provider moves it).`
        );
      }
    } finally {
      logger.info('Tab opened by the expenses link', { expectedUrl, requestedUrl, settledUrl });
      // A foreground target="_blank" tab throttles the app page and swallows the next interaction,
      // so always close it and hand focus back to the app.
      await ssoTab.close().catch(() => {});
      await appPage.bringToFront().catch(() => {});
    }

    return { url: requestedUrl, settledUrl };
  },

  /**
   * Verifies the tab opened by the expenses link SETTLES on an expected URL prefix, then closes
   * that tab and returns focus to the app.
   *
   * This is the third of three deliberately separate expenses-tab verifications. The other two:
   * verifyExpensesTabUrl asserts the window.open TARGET (the configured expense.Url, before any
   * redirect), and verifyExpensesSsoTabOpened asserts only that the tab left the app's own origin.
   *
   * WHAT IS COMPARED: the URL the opened tab LANDS on, after any provider-side redirect. Use this
   * when the corporation is configured with an SSO bounce endpoint rather than the provider itself
   * - e.g. the Mesh corporation configures the relative "/MeshLogin/MeshLogin", which the app
   * prefixes with its expense endpoint, and which then hands off to Mesh. In that setup the
   * configured URL and the landing URL are different hosts, so verifyExpensesTabUrl cannot express
   * "the user reached the provider" and this method is the only one that can.
   *
   * A PREFIX, not equality: the landing URL is provider-controlled and routinely carries a path or
   * query the handshake appended, so pinning it exactly would break on a provider change that is
   * not a regression. Pass the longest prefix that still proves the right provider was reached
   * (origin at minimum). If a run ever fails because the provider moved to a different path, widen
   * the prefix - never drop the assertion or fall back to the configured URL, which would stop
   * testing the handoff entirely.
   *
   * The URL is polled: the tab starts on about:blank and passes THROUGH the bounce endpoint before
   * the provider, so the first http(s) URL it reports is usually not the landing one.
   *
   * @param {import('playwright').Page} ssoTab - The tab captured when the expenses link was clicked
   * @param {import('playwright').Page} appPage - The app tab; refocused after the assertion
   * @param {string} expectedUrlPrefix - The URL prefix the tab must land on, scheme included
   * @returns {Promise<{landedUrl: string, expectedUrlPrefix: string}>}
   */
  async verifyExpensesTabLandingUrl(ssoTab, appPage, expectedUrlPrefix) {
    if (!ssoTab) {
      throw new Error(
        '[App.verifyExpensesTabLandingUrl] "ssoTab" is required - no opened tab was stored. Ensure the ' +
        '"I open the ... expenses link from the side navigation" step ran first.'
      );
    }
    if (!appPage) {
      throw new Error('[App.verifyExpensesTabLandingUrl] "appPage" is required - it is refocused after the assertion.');
    }
    if (!expectedUrlPrefix || typeof expectedUrlPrefix !== 'string') {
      throw new Error(
        `[App.verifyExpensesTabLandingUrl] "expectedUrlPrefix" must be a non-empty string, got: ` +
        `${typeof expectedUrlPrefix} (${JSON.stringify(expectedUrlPrefix)})`
      );
    }
    const hasScheme = expectedUrlPrefix.startsWith('http://') || expectedUrlPrefix.startsWith('https://');
    if (!hasScheme) {
      throw new Error(
        `[App.verifyExpensesTabLandingUrl] "expectedUrlPrefix" must include an http(s) scheme so it cannot ` +
        `accidentally match a relative or about:blank URL, got: "${expectedUrlPrefix}"`
      );
    }

    logger.debug('Verifying the landing URL of the tab opened by the expenses link', { expectedUrlPrefix });

    // startsWith rather than a substring/regex match: the prefix must anchor at the start, so it can
    // never be satisfied mid-URL by something like "?next=https://provider" on a page that in fact
    // never left the bounce endpoint.
    let lastSeenUrl = '';
    let landedUrl;

    try {
      try {
        await expect
          .poll(
            () => {
              lastSeenUrl = ssoTab.url();
              return lastSeenUrl.startsWith(expectedUrlPrefix);
            },
            { timeout: 30000 }
          )
          .toBe(true);
      } catch (err) {
        // expect.poll's own message can only report "expected true, received false", which would not
        // say WHERE the tab actually stopped - the single most useful fact for diagnosing this.
        throw new Error(
          `[App.verifyExpensesTabLandingUrl] Expected the tab opened by the expenses link to land on a URL ` +
          `starting with "${expectedUrlPrefix}", but after 30s it was still on "${lastSeenUrl}". The tab ` +
          `starts on about:blank and passes through the corporation's configured bounce endpoint first, so ` +
          `stopping short means the handoff to the provider did not complete - the bounce endpoint errored, ` +
          `the provider is unreachable, or this corporation is configured with a different provider. Check ` +
          `the expenses provider on the corporation rather than the selector. Original: ${err.message}`
        );
      }

      landedUrl = lastSeenUrl;
    } finally {
      logger.info('Tab opened by the expenses link settled', { expectedUrlPrefix, landedUrl: landedUrl || null });
      // A foreground target="_blank" tab throttles the app page and swallows the next interaction,
      // so always close it and hand focus back to the app.
      await ssoTab.close().catch(() => {});
      await appPage.bringToFront().catch(() => {});
    }

    return { landedUrl, expectedUrlPrefix };
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
