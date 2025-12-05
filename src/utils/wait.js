/**
 * Wait Utility Functions
 * 
 * This module provides utility functions for waiting operations in Playwright tests,
 * including text-based waiting and simple timeout delays.
 */

/**
 * Waits for an element to contain specific text content
 * Continuously polls the element until the text matches the expected value
 * 
 * @param {Object} page - Playwright page instance
 * @param {string} selector - CSS selector to locate the element
 * @param {string} expectedText - The exact text content to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 30000)
 * @returns {Promise<void>}
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
 * Simple wait helper with seconds conversion
 * Provides a more readable way to add delays in test execution
 * 
 * @param {Object} page - Playwright page instance
 * @param {number} seconds - Number of seconds to wait
 * @returns {Promise<void>}
 */
async function wait(page, seconds) {
  await page.waitForTimeout(seconds * 1000);
}

module.exports = {
  waitForText,
  wait,
};
