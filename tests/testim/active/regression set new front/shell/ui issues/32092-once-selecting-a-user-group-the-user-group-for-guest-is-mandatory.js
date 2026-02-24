/*
 * Test Name: 32092 Once selecting a user group, the user group for guest is mandatory
 * Description: 
 * Status: Active
 * Labels: Regression,No Amadeus Hotel Book,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-06-19T03:45:43Z
 * Updated: 2026-02-17T06:46:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("testim@prof.com");
  await book_a_new_trip();
  await page.click(".add-btn .is-flex");
  await page.click(".add-guest-btn");
  await page.click("body > :nth-child(11) [role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.click("[placeholder='First Name']");
  await page.type("[placeholder='First Name']", 'Helena');
  await page.click("[placeholder='Last Name']");
  await page.type("[placeholder='Last Name']", 'Glir');
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(1) .el-select__caret");
  await waitForText(page, "[id^='el-id']", 'Female');
  await page.click("[id^='el-id']");
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'helena@glir.com');
  await page.click(".add-guest-btn");
  //TODO Please add an assertion here
await isVisible(page, ".filled");
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function isVisible(page, selector) {
  try {
    const elementHandle = await page.$(selector);
    if(!elementHandle) {
      return false;
    }
    const elementBox = await elementHandle.boundingBox();
    return Boolean(elementBox);
  } catch(err) {
    return false;
  }
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

