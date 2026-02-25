/*
 * Test Name: 41654 Form of payment - City is valid if it has a "space"
 * Description: 
 * Status: Active
 * Labels: Profile,Regression,FOP,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-01-25T02:51:04Z
 * Updated: 2025-07-14T07:26:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('analucia@cardadmin.com');
  await Navigating_to_user_profile();
  await Adding_cc_and();
  await Delete_cc();
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

async function Adding_cc_and() {
  await page.click("[id='tab-formOfPayment'] p");
  await page.click(".add-card-btn");
  await page.click(".card-inputs-container > :nth-child(1) > :nth-child(1) [type='text']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type(".card-inputs-container > :nth-child(1) > :nth-child(1) [type='text']", randomValue);
  await page.click(".credit-type-select .el-select__placeholder");
  await page.type("#el-id-79-891", 'visa');
  await page.click("#el-id-79-611 > div");
  await page.click(".card-inputs-container > :nth-child(1) > :nth-child(3) [type='text']");
  await page.type(".card-inputs-container > :nth-child(1) > :nth-child(3) [type='text']", 'testim');
  await page.click(".insert-card-btn");
  await page.click("[placeholder='Please enter your credit card number']");
  await page.type("[placeholder='Please enter your credit card number']", '4580458045804580');
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".card-inputs-container > :nth-child(1) > :nth-child(4) .label", 'Card number');
  await page.click(".expiration-inputs > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1518-622");
  await page.click(".expiration-inputs > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1518-637");
  await page.type("[placeholder='First Name']", 'bruna');
  await page.type(".card-inputs-container > :nth-child(2) > :nth-child(2) [type='text']", 'new york city');
  await page.type(".card-inputs-container > :nth-child(2) > :nth-child(3) [type='text']", '75751');
  await page.type("#el-id-1518-898", 'portugal');
  await page.click("#el-id-1518-822");
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, ".el-notification__title", 'Success');
  await waitForText(page, ".card-holder-name", 'testim');
}

async function Delete_cc() {
  await page.click("#el-id-1518-902 > li:nth-child(2) > p");
  await page.click(".btn--primary");
}

