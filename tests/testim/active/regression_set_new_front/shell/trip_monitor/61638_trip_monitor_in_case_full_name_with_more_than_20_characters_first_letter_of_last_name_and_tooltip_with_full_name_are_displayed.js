/*
 * Test Name: 61638 Trip Monitor - In case full name with more than 20 characters, first letter of last name and tooltip with full name are displayed
 * Description: 
 * Status: Active
 * Labels: Trip monitor,Regression,name,full name,guest,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-06T08:38:51Z
 * Updated: 2025-07-08T09:13:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await Navigate_to__My_Trips_();
  await Navigate_to_the_specific_trip();
  await First_letter_of_last_name_and_tooltip_with_full_name_are_displayed();
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

async function Navigate_to__My_Trips_() {
  await page.click("[title='Trips'] .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
}

async function Navigate_to_the_specific_trip() {
  await page.click(".el-checkbox-group > :nth-child(8) .el-checkbox__inner");
  await page.type("#el-id-9465-212", '3487972');
  await waitForText(page, "#el-id-7554-112 > li:nth-child(3)", /Click here to expand your search/);
  await page.click("[class^='ml'], [class*=' ml']");
  await waitForText(page, ".trip-title", 'Trip  3487972');
}

async function First_letter_of_last_name_and_tooltip_with_full_name_are_displayed() {
  await waitForText(page, "[title='Bruna Don Diego De La Vega']", 'Bruna V');
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

