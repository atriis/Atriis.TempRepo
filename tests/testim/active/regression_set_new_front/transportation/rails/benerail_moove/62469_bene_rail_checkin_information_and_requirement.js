/*
 * Test Name: 62469 Bene> Rail Check-In Information and Requirement
 * Description: existing trip 3492126 (as new trips with check in info are not common)
to check the msg, button and time info
 * Status: Active
 * Labels: Cart,Benerail Moove Regression,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-05-22T06:34:25Z
 * Updated: 2025-06-24T10:33:07Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('bene@sncb.com');
  await Book_a_new_trip();
  await page.goto('https://ui.gtp-staging.com/trips/3492126/cart');
  await waitForText(page, ".app-msg-text", 'Important: Some train segments require check-in.');
  await waitForText(page, ".el-tabs .btn--primary", 'Check-in');
  await page.click(".el-tabs .btn--primary");
  await waitForText(page, ".leg-title", 'Outbound');
  await waitForText(page, "body > :nth-child(29) .app-columns > :nth-child(1) > :nth-child(3)", /Available from/);
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

async function Book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

