/*
 * Test Name: 24241 homepage - user with 2 products or less see "start new trip" button
 * Description: user with 2 products or less see "start new trip" button in the homepage. click opens the first product search page
 * Status: Quarantine
 * Labels: Fit for Prod
 * Owner: Shani Hadar
 * Created: 2023-02-07T09:52:47Z
 * Updated: 2024-02-11T07:04:12Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('moni@carotel.com');
  await waitForText(page, ".imt-btn", 'Start New Trip');
  await page.click(".imt-btn");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
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

