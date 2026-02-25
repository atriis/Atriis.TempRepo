/*
 * Test Name: 41744 Trip monitor- show "my trip" checkbox
 * Description: 
 * Status: Active
 * Labels: Trip monitor,Regression,Sanity,Pre Prod,Daily Shell,2026 plan 1
 * Owner: pini harush
 * Created: 2024-01-29T03:28:55Z
 * Updated: 2024-01-29T03:33:13Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('approval@flow.com');
  await page.click("[title='Trips'] .material-symbols-outlined");
  await waitForText(page, ".app-filter__content > div:nth-of-type(2) .el-checkbox__label", 'My trips only');
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

