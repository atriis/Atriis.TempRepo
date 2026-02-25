/*
 * Test Name: 61474 Profile - Dynamic Fields - Warning messages are not displayed because dynamic field was filled in the traveler's profile
 * Description: 
 * Status: Active
 * Labels: Regression,Dynamic fields,Profile,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-04-24T01:26:17Z
 * Updated: 2025-09-14T10:50:53Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('dynafiel@dynamicprofilecorp.com');
  await book_a_new_trip();
  await Navigating_to_user_profile();
  await Warning_messages_are_not_displayed_because_dynamic_field_was_filled_in_the_traveler_s_profile();
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

async function Navigating_to_user_profile() {
  await waitForText(page, "h1", /Welcome/);
  await page.hover(".passenger-avatar");
  await page.click(".user-profile-link p");
}

async function Warning_messages_are_not_displayed_because_dynamic_field_was_filled_in_the_traveler_s_profile() {
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await waitForText(page, ".reference-fields-container .el-select__placeholder span", '1');
}

