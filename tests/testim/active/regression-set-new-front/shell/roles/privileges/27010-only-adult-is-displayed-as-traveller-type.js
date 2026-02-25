/*
 * Test Name: 27010 Only "Adult" is displayed as traveller type
 * Description: 
 * Status: Active
 * Labels: Regression,Role,traveler,Adding Passengers,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-04-16T01:21:26Z
 * Updated: 2026-02-16T03:05:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('olgay@amsalem.com');
  await book_a_new_trip();
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await page.click(".add-btn .is-flex");
  await page.click(".add-guest-btn");
  await waitForText(page, ".personal-info-container > :nth-child(3) > :nth-child(3) .label", 'Traveler type');
  await page.click("[name='traveler-Type'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, "#el-id-4236-942 > span", 'Adult (Ages 18+)');
  await List_length__with_locator_as_parameter_('1', '.el-select-dropdown__item.is-selected.is-hovering');
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function List_length__with_locator_as_parameter_(length, locator) {
  await page.evaluate((length, locator) => {
    const expectedLength = Number(length); // Replace 'length' with the expected number of visible elements
    
    // Convert NodeList to an array, ensure exact matches, and filter for visible elements
    const elements = Array.from(document.querySelectorAll(locator))
      .filter(el => el.matches(locator)) // Ensure the element exactly matches the locator
      .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)); // Robust visibility check
    
    // Validate the number of visible and exact match elements
    if (elements.length === expectedLength) {
      console.log(`The element appears ${elements.length} times and is visible.`);
    } else {
      throw new Error(`Assertion failed: Expected ${expectedLength} visible elements, but found ${elements.length}.`);
    }
    
  }, length, locator);
}

