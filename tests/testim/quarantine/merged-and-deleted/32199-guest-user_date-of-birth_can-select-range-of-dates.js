/*
 * Test Name: 32199 Guest User - Date of Birth - Can select range of dates
 * Description: Test not relevant anymore, according to Yael. Agreed to remove from regression.
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-06-21T03:18:33Z
 * Updated: 2024-10-02T09:28:01Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login("Shani@Testimcorpnl.com");
  await book_a_new_trip();
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click("[placeholder='DD/MM/YYYY']");
  await waitForText(page, ".show-year-arrows [aria-label='Wednesday']", 'Wed');
  await page.click(".el-year-table tbody > :nth-child(3) > td:nth-of-type(1) .cell");
  await waitForText(page, ".el-date-picker__header > :nth-child(3)", '1959');
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

