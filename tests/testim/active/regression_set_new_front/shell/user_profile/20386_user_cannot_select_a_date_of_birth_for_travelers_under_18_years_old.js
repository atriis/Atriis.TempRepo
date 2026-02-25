/*
 * Test Name: 20386 User cannot select a date of birth for travelers under 18 years old
 * Description: 
 * Status: Active
 * Labels: Regression,traveler,Adding Passengers,DOB,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-04-17T08:37:06Z
 * Updated: 2026-01-08T08:55:46Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await book_a_new_trip();
  await User_cannot_select_a_date_of_birth_for_travelers_under_18_years_old();
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

async function User_cannot_select_a_date_of_birth_for_travelers_under_18_years_old() {
  await page.click(".has-text-weight-semibold");
  await page.click(".add-guest-btn");
  await page.click("#el-id-6142-1854");
  await waitForText(page, ".hide-day .el-date-picker__header > :nth-child(2)", '2008');
  await page.click("#el-id-6142-1590 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.d-arrow-right > i > svg > path");
  await page.click(".hide-day tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.waitForSelector(".hide-day .el-picker-panel__body", {state: "visible"});
}

