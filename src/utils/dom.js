/**
 * DOM Utility Functions
 *
 * This file contains low-level helpers used across the entire test suite.
 * These helpers handle unstable or varying UI structures in a safe way.
 *
 * IMPORTANT:
 * - This file is intentionally defensive
 * - Timeouts and waits are intentional
 * - Behavior must remain stable
 */

const logger = require("./logger").child("DOM");

/**
 * Reads visible text from the first matching element.
 *
 * Why this exists:
 * - Ensures the element is visible before reading
 * - Avoids flaky reads from hidden or detached elements
 *
 * @param {Object} page - Playwright page instance
 * @param {string} selector - CSS selector for the element
 * @returns {Promise<string>} Visible text content
 * @throws {Error} If page or selector are invalid
 */
async function getText(page, selector) {
  if (!page) {
    throw new Error('page is required');
  }
  
  if (!selector || typeof selector !== 'string') {
    throw new Error('selector must be a non-empty string');
  }
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible" });
  return locator.textContent();
}

/**
 * Extracts a numeric value from a DOM element.
 * Works with both page and frame contexts.
 *
 * Why this exists:
 * - Prices and numbers appear in various formats ($123.45, €1,234.56)
 * - Need consistent extraction across main page and iframes (email previews)
 * - Removes currency symbols and formatting automatically
 *
 * @param {import('@playwright/test').Page|import('@playwright/test').Frame} context - Playwright page or frame
 * @param {string} selector - CSS selector for the element
 * @param {number} index - Zero-based index of the element (default: 0)
 * @returns {Promise<number|null>} Parsed number, or null if not found
 * @throws {Error} If context or selector are invalid, or index is negative
 * @example
 *   extractNumber(page, '.amount', 0)  → first price on page
 *   extractNumber(frame, '.amount', 1) → second price in frame
 */
async function extractNumber(context, selector, index = 0) {
  if (!context) {
    throw new Error('context (page or frame) is required');
  }
  
  if (!selector || typeof selector !== 'string') {
    throw new Error('selector must be a non-empty string');
  }
  
  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be a non-negative number, got ${typeof index === 'number' ? index : typeof index}`);
  }
  const rawText = await context
    .locator(selector)
    .nth(index)
    .textContent();

  if (!rawText) return null;

  return Number(rawText.replace(/[^0-9.]/g, ''));
}

/**
 * Scrolls an element into the visible area of the screen.
 *
 * Why this exists:
 * - Some elements are present in the DOM but not visible
 * - Scrolling prevents click and hover failures
 *
 * @param {Object} page - Playwright page instance
 * @param {string} selector - CSS selector for the element
 * @throws {Error} If page or selector are invalid
 */
async function scrollToElement(page, selector) {
  if (!page) {
    throw new Error('page is required');
  }
  
  if (!selector || typeof selector !== 'string') {
    throw new Error('selector must be a non-empty string');
  }
  const el = page.locator(selector).first();

  // Wait until element exists in the DOM
  await el.waitFor({ state: "attached" });

  // Then ensure it is actually visible
  await el.waitFor({ state: "visible" });

  await el.evaluate((node) => {
    node.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "auto",
    });
  });
}

/**
 * Types a value into the nth available input found using fallback selectors.
 *
 * Why this exists:
 * - Different suppliers use different placeholders
 * - Some pages render multiple similar inputs
 * - This logic safely finds the correct one
 *
 * Example:
 * - selectors = [selectorA, selectorB]
 * - nth = 1 → second matching input
 *
 * Notes:
 * - This helper does NOT use fixed delays.
 * - If a specific UI needs autocomplete/suggestions to appear after typing,
 *   the caller should wait for that UI-specific signal (e.g. suggestion list visible).
 *
 * @param {Object} page - Playwright page instance
 * @param {string} value - Value to type
 * @param {string[]} selectors - List of selectors to try
 * @param {number} nth - 0-based index of the input to use
 * @returns {Promise<string>} Selector that was successfully used
 */
async function typeIntoNthAvailableInput(page, value, selectors, nth = 0) {
  const expected = String(value ?? "").trim();

  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count();

    if (count > nth) {
      const target = locator.nth(nth);

      // Logged on purpose to help debug selector mismatches
      logger.debug("Typing into input", {
        value,
        position: nth + 1,
        selector
      });

      await target.waitFor({ state: "visible" });
      await target.click();
      await target.fill(value);

      // Deterministic: wait until the input's value is actually applied in the DOM
      await page.waitForFunction(
        ([selector, index, expected]) => {
          const el = document.querySelectorAll(selector)?.[index];
          if (!el) return false;

          // Most inputs use .value; fallback to textContent if needed
          const raw =
            typeof el.value === "string" ? el.value : (el.textContent || "");

          return raw.trim() === expected;
        },
        [selector, nth, expected],
      );

      return selector;
    }
  }

  throw new Error(
    `Unable to find an input for "${value}" at position ${nth}. No selector matched.`,
  );
}

/**
 * Simulates pressing the Tab key.
 *
 * Why this exists:
 * - Many autocomplete fields confirm selection on Tab
 * - Adds a small delay to allow UI focus changes
 *
 * @param {Object} page - Playwright page instance
 * @throws {Error} If page is invalid
 */
async function pressTab(page) {
  if (!page) {
    throw new Error('page is required');
  }
  await page.keyboard.press("Tab");
}

/**
 * Waits for an element to be visible and enabled (not disabled).
 * @param {import('@playwright/test').Locator} locator
 * @param {number} [timeout=5000]
 * @throws {Error} If locator is invalid or timeout is negative
 */
async function waitForEnabled(locator, timeout = 5000) {
  if (!locator) {
    throw new Error('locator is required');
  }
  
  if (typeof timeout !== 'number' || timeout < 0) {
    throw new Error(`timeout must be a non-negative number, got ${timeout}`);
  }
  await locator.waitFor({ state: "visible", timeout });
  await locator.waitFor({ state: "attached", timeout });
  // Playwright does not have a direct "enabled" state, so check attribute
  await locator.evaluate((el) => !el.hasAttribute("disabled"));
}

module.exports = {
  getText,
  extractNumber,
  scrollToElement,
  typeIntoNthAvailableInput,
  pressTab,
  waitForEnabled,
};
