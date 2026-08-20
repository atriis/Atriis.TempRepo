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
 * Parses a currency/amount text into a number.
 *
 * Why this exists:
 * - Some UI surfaces expose amounts via textContent rather than a stable selector path
 * - Original/display amounts may include currency symbols, spaces, commas, or parentheses
 * - Page objects need one shared parser to avoid duplicating amount parsing logic
 *
 * @param {string} text - Raw text containing an amount
 * @param {string} label - Human-readable label for error reporting
 * @returns {number}
 */
function parseAmountText(text, label) {
  // Resolve the decimal separator so both US ("12,637.50") and European ("12.637,50") formats
  // parse correctly: when both separators are present the rightmost is the decimal; a lone comma
  // is decimal only when followed by 1-2 digits, otherwise it is a thousands separator.
  let s = (text ?? '').replace(/[^\d.,-]/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    s = lastComma > lastDot
      ? s.replace(/\./g, '').replace(',', '.') // 12.637,50 -> 12637.50
      : s.replace(/,/g, ''); // 12,637.50 -> 12637.50
  } else if (lastComma !== -1) {
    // Only comma(s): decimal when followed by 1-2 digits, else thousands.
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  }
  // Only dots or plain digits: the dot is already the decimal separator.

  const amount = Number.parseFloat(s);

  if (Number.isNaN(amount)) {
    throw new Error(`Could not parse ${label} from text: "${text}"`);
  }

  return amount;
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

/**
 * Collapses whitespace, non-breaking spaces and zero-width characters in HTML-derived text.
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeHtmlText(text) {
  return (text ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts every hyperlink from a raw HTML string.
 *
 * Why this exists:
 * - The itinerary/quote emails are backend-generated table documents. Their links are read
 *   both from the share dialog preview (iframe srcdoc) and from the delivered mail fetched
 *   over a mailbox API, and both have to be compared against each other, so they must be
 *   parsed identically.
 * - Parsing the HTML string rather than a live DOM avoids having to scroll a long email
 *   document to bring links into view.
 *
 * @param {string} html - Raw HTML
 * @returns {Array<{text: string, href: string}>} Link label (tags stripped) and href, in document order
 */
function extractHtmlLinks(html) {
  if (typeof html !== "string" || html.trim() === "") {
    return [];
  }

  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => {
    const hrefMatch = /href=["']([^"']*)["']/i.exec(match[1]);
    return {
      text: normalizeHtmlText(match[2].replace(/<[^>]+>/g, " ")),
      href: hrefMatch ? hrefMatch[1].trim() : "",
    };
  });
}

/**
 * Reads how far a page is currently scrolled away from its top, and how far it could
 * scroll at all.
 *
 * Why this exists:
 * - "The page is displayed at the top" can only be proven by measuring the real
 *   scroll offset, and the element that owns the scroll is not always the document
 * - A layout that scrolls an inner container leaves window.scrollY at 0, so a
 *   window-only reading would report "at top" wherever the list actually sits,
 *   and the assertion could never fail
 * - A page too short to scroll has its offset pinned to 0, so "at the top" is true by
 *   construction there. The reported range lets a caller notice that and say so,
 *   instead of counting it as a pass
 *
 * How it works:
 * - Reads the document scroll offset from window, documentElement and body,
 *   because which of the three owns the scroll depends on the page CSS
 * - Walks up from the anchor element over every genuinely scrollable ancestor
 *   (overflow auto/scroll/overlay, and taller than its own box), keeping the largest
 *   scrollTop and the largest scrollable range found, so an inner scroll container is
 *   measured too
 * - Reports the largest offset and the largest range, plus a description of the
 *   container the offset came from so a failure says what was scrolled
 *
 * @param {Object} page - Playwright page instance
 * @param {string|null} anchorSelector - Element whose scrollable ancestors are inspected
 * @returns {Promise<{offset: number, range: number, document: number, container: number, containerDescription: string}>}
 * @throws {Error} If page is invalid, or anchorSelector is provided but not a non-empty string
 */
async function getScrollOffsetFromTop(page, anchorSelector = null) {
  if (!page) {
    throw new Error('page is required');
  }

  if (anchorSelector !== null && (typeof anchorSelector !== 'string' || anchorSelector.trim() === '')) {
    throw new Error('anchorSelector must be a non-empty string when provided');
  }

  return page.evaluate((selector) => {
    const root = document.scrollingElement || document.documentElement;

    const documentOffset = Math.round(
      Math.max(
        window.scrollY || 0,
        document.documentElement ? document.documentElement.scrollTop : 0,
        document.body ? document.body.scrollTop : 0,
      ),
    );
    const documentRange = Math.round(Math.max(root ? root.scrollHeight - root.clientHeight : 0, 0));

    let container = 0;
    let containerRange = 0;
    let containerDescription = '';

    const anchor = selector ? document.querySelector(selector) : null;
    for (let element = anchor && anchor.parentElement; element; element = element.parentElement) {
      const overflowY = window.getComputedStyle(element).overflowY;
      const isScrollable =
        /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight + 1;
      if (!isScrollable) continue;

      containerRange = Math.max(containerRange, Math.round(element.scrollHeight - element.clientHeight));

      if (element.scrollTop > container) {
        container = Math.round(element.scrollTop);
        const classes =
          typeof element.className === 'string' && element.className.trim()
            ? '.' + element.className.trim().split(/\s+/).join('.')
            : '';
        containerDescription = element.tagName.toLowerCase() + classes;
      }
    }

    return {
      offset: Math.max(documentOffset, container),
      range: Math.max(documentRange, containerRange),
      document: documentOffset,
      container,
      containerDescription,
    };
  }, anchorSelector);
}

module.exports = {
  extractNumber,
  parseAmountText,
  typeIntoNthAvailableInput,
  pressTab,
  extractHtmlLinks,
  normalizeHtmlText,
  getScrollOffsetFromTop,
};
