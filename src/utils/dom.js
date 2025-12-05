/**
 * DOM Utility Functions
 * 
 * This module provides utility functions for interacting with DOM elements
 * in Playwright tests, including text extraction, scrolling, and input handling.
 */

/**
 * Extracts text content from the first matching element
 * Waits for the element to be visible before retrieving text
 * 
 * @param {Object} page - Playwright page instance
 * @param {string} selector - CSS selector to locate the element
 * @returns {Promise<string>} The text content of the element
 */
async function getText(page, selector) {
  const locator = page.locator(selector).first();

  await locator.waitFor({ state: 'visible' });

  const text = await locator.textContent();
  return text;
}

/**
 * Scrolls an element into view within the viewport
 * Ensures element is attached and visible before scrolling
 * 
 * @param {Object} page - Playwright page instance
 * @param {string} selector - CSS selector to locate the element to scroll to
 * @returns {Promise<void>}
 */
async function scrollToElement(page, selector) {
  const el = page.locator(selector).first();

  // First wait for element to exist in DOM
  await el.waitFor({ state: 'attached' });

  // Then wait for it to be visible onscreen
  await el.waitFor({ state: 'visible' });

  await el.evaluate((node) => {
    node.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'auto'
    });
  });
}

/**
 * Types a value into the nth available input element from a list of selectors
 * Tries each selector in order until finding one with sufficient matching elements
 * 
 * @param {Object} page - Playwright page instance
 * @param {string} value - Value to type into the input field
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {number} nth - Index of the element to target (0-based, defaults to 0)
 * @returns {Promise<string>} The selector that was successfully used
 * @throws {Error} When no selector has enough matching elements
 */
async function typeIntoNthAvailableInput(page, value, selectors, nth = 0) {
  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count();

    if (count > nth) {
      const target = locator.nth(nth);
      console.log(`Typing "${value}" into ${nth + 1}º match of: ${selector}`);
      await target.click();
      await target.fill(value);
      await page.waitForTimeout(800);
      await page.keyboard.press("Tab");
      return selector;
    }
  }

  throw new Error(`No selector with index ${nth} found to type: "${value}"`);
}

module.exports = {
  getText,
  scrollToElement,
  typeIntoNthAvailableInput,
};
