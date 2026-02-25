/*
 * Test Name: 32625 privilege can book for yourself and your user group
 * Description: user with the privilege "can book for yourself and your user group" can book only for himself and his user group
 * Status: Quarantine
 * Labels: Daily Shell
 * Owner: Shani Hadar
 * Created: 2023-06-22T10:59:37Z
 * Updated: 2025-11-04T08:41:22Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Pablo@Davidov.com');
  await book_a_new_trip();
  await waitForText(page, ".traveler-name", 'Add traveller');
  await page.click(".traveler-name");
  await waitForText(page, ".autocomplete-title", /Search/);
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'mali cohen');
  await waitForText(page, "h2", 'Mali              Cohen');
  await page.click("h2");
  await waitForText(page, ".traveler-name", 'Mali Cohen');
  await page.waitFor(2000);
  await page.click("[aria-describedby='el-tooltip-2499']");
  await waitForText(page, ".has-text-weight-semibold", 'Add traveller');
  await page.click(".has-text-weight-semibold");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'pablo davidov');
  await waitForText(page, "h2", 'Pablo              Davidov');
  await page.click("h2");
  await waitForText(page, ".travelers-list > section:nth-of-type(2) .traveler-name", 'Pablo Davidov');
  await page.click("[aria-describedby='el-tooltip-2165']");
  await waitForText(page, ".has-text-weight-semibold", 'Add traveller');
  await page.click(".has-text-weight-semibold");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'shani cohen');
  // Converting a 'negative-element-validation' step has to be done manually at this time
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

