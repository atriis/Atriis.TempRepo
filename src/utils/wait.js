/**
 * Wait Utility Functions
 *
 * This file contains small, reusable helpers that control timing
 * and synchronization in Playwright tests.
 *
 * IMPORTANT:
 * - These helpers are intentionally generic
 * - They do not know anything about Flights, Hotels, Cars, etc.
 * - They exist to make tests more stable and readable
 */

/**
 * Waits until a specific element contains an exact text value.
 *
 * Why this exists:
 * - UI elements often appear before their final text is ready
 * - Waiting only for visibility is sometimes not enough
 * - This avoids flaky assertions based on timing
 *
 * How it works:
 * - Repeatedly checks the DOM
 * - Reads the element text
 * - Normalizes whitespace and line breaks
 * - Compares against the expected value
 *
 * @param {Object} page - Playwright page instance
 * @param {string} selector - CSS selector used to locate the element
 * @param {string} expectedText - The exact text we expect to see
 * @param {number} timeout - Max time to wait in milliseconds (default: 30s)
 */
async function waitForText(page, selector, expectedText, timeout = 30000) {
  await page.waitForFunction(
    ([selector, expectedText]) => {
      const element = document.querySelector(selector);
      if (!element) return false;

      const text = element.textContent
        .replace(/[\r\n]+/g, '')
        .trim();

      return text === expectedText.trim();
    },
    [selector, expectedText],
    { timeout }
  );
}

/**
 * Simple delay helper (seconds → milliseconds).
 *
 * Why this exists:
 * - Makes waits easier to read in code
 * - Avoids repeating "seconds * 1000" everywhere
 *
 * IMPORTANT:
 * - This should be used sparingly
 * - Prefer state-based waits (like waitForText) whenever possible
 *
 * @param {Object} page - Playwright page instance
 * @param {number} seconds - Number of seconds to wait
 */
async function wait(page, seconds) {
  await page.waitForTimeout(seconds * 1000);
}

module.exports = {
  waitForText,
  wait,
};