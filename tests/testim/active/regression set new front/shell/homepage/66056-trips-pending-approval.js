/*
 * Test Name: 66056 Trips pending approval
 * Description: 
 * Status: Active
 * Labels: Daily Shell,Regression,2026 plan 2
 * Owner: Yael
 * Created: 2025-08-26T06:49:19Z
 * Updated: 2025-09-21T02:53:06Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('uri@e.com');
  await page.click(".el-tabs__header p");
  await page.click(".trip-tabs-container .btn");
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

