/*
 * Test Name: 33152 Moving between language works as expected
 * Description: 
 * Status: Active
 * Labels: UI,Regression,No Amadeus Hotel Book,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-07-10T04:16:28Z
 * Updated: 2023-07-11T08:48:17Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bsafkl@bsafkl.com');
  await book_a_new_trip();
  await page.hover(".support-icon");
  await page.click(".el-tooltip__popper > :nth-child(5)");
  await waitForText(page, ".welcome", 'Bentornato Bruna');
  await page.hover(".support-icon");
  await page.click(".el-tooltip__popper > :nth-child(1)");
  await waitForText(page, ".welcome", 'Welcome back Bruna');
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

