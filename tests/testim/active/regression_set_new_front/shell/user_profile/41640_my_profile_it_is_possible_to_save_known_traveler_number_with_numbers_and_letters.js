/*
 * Test Name: 41640 "My Profile" - It is possible to save known traveler number with numbers and letters
 * Description: 
 * Status: Active
 * Labels: Regression,Profile,known traveler,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-01-25T10:21:57Z
 * Updated: 2025-07-14T07:33:12Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimendes@amadeus.com');
  await Navigating_to_user_profile();
  await Saving_known_traveler_number_with_numbers_and_letters();
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

async function Navigating_to_user_profile() {
  await waitForText(page, "h1", /Welcome/);
  await page.hover(".passenger-avatar");
  await page.click(".user-profile-link p");
}

async function Saving_known_traveler_number_with_numbers_and_letters() {
  await page.click("[id='tab-passportsAndVisas'] p");
  await page.click("[class^='is-flex-grow'], [class*=' is-flex-grow'] [type='text']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("[class^='is-flex-grow'], [class*=' is-flex-grow'] [type='text']", randomValue);
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, ".el-notification__title", 'Success');
}

