/*
 * Test Name: 25507 Edit all RF but no Dynamic
 * Description: Edit RF and DYN via overview
 * Status: Active
 * Labels: Reference Fields,Regression,No Amadeus Hotel Book,2026 plan 1
 * Owner: pini harush
 * Created: 2023-02-16T01:33:00Z
 * Updated: 2025-09-07T08:06:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('can@edit.chk');
  await waitForText(page, ".trip-tabs-container .btn", 'All trips');
  await page.click(".trip-tabs-container .btn");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
  await page.type("[placeholder='Location, trip or travellers']", '3222550');
  await waitForText(page, "#el-id-1637-90 > li:nth-child(3)", /Click here to expand/);
  await page.click("[class^='ml'], [class*=' ml']");
  await waitForText(page, ".trip-id", '3222550');
  await page.click(".app-label");
  await waitForText(page, ".other-products-quote-card .center-title", /DO NOT CANCEL/);
  await page.hover("#el-id-8072-15 > span");
  await page.click("#el-id-8072-16 > li:nth-child(4)");
  await waitForText(page, "#el-collapse-head-85 > div > span", 'General Reference Questions');
  await page.click("body > :nth-child(27) .btn--primary");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".btn--primary");
  await waitForText(page, ".el-notification__title", 'Success');
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

