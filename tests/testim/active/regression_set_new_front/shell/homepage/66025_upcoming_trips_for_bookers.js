/*
 * Test Name: 66025 Upcoming trips for bookers
 * Description: 
 * Status: Active
 * Labels: Regression,Trip monitor,Trips,Booker,Homepage,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-09-12T02:28:54Z
 * Updated: 2025-09-12T02:44:13Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("we@s.com");
  await Click__All_trips_();
  await __My_trips_only__filter_is_checked();
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

async function Click__All_trips_() {
  await waitForText(page, "[id='pane-upcoming-trips'] .btn", 'All trips');
  await page.click("[id='pane-upcoming-trips'] .btn");
}

async function __My_trips_only__filter_is_checked() {
  await waitForText(page, ".app-filter__content > div:nth-of-type(2) .el-checkbox__label", 'My trips only');
  //TODO Please add an assertion here
await isElementChecked(page, ".app-filter__content > :nth-child(3) .el-checkbox__input");
}

