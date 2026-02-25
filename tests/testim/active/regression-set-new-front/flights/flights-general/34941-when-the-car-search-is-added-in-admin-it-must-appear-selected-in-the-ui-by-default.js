/*
 * Test Name: 34941 When the car search is added in admin it must appear selected in the UI by default
 * Description: 
 * Status: Active
 * Labels: Regression,CR7,No Amadeus Hotel Book,2026 plan 1
 * Owner: Unassigned
 * Created: 2023-08-22T06:00:21Z
 * Updated: 2023-12-28T12:19:27Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("carolinaferreira@joysettings.com");
  await book_a_new_trip();
  await page.click("[id='tab-flight'] p");
  //TODO Please add an assertion here
await isElementChecked(page, "[class^='my'], [class*=' my'] .control > :nth-child(2) .el-checkbox");
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
  }, selector);
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

