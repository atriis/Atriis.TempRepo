/*
 * Test Name: HYBRID for 62913 Benerail Moove - Full name is correctly sent in the request when passenger full name has more than 15 characters
 * Description: 
 * Status: Active
 * Labels: Benerail Moove Regression,hybrid,full name,Rail,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-30T11:03:53Z
 * Updated: 2025-09-02T03:10:43Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bruolisan@benerailmoovecorp.com');
  await book_a_new_trip();
  await Add_random_guest_16_characters();
  await Search_benerail_by_place_one_way('BEBMI', 'NLASC');
  await Benerail___Results___Wait_for__Select__text();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
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

async function Add_random_guest_16_characters() {
  await page.click(".has-text-weight-semibold");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await page.type("[placeholder='First Name']", 'VAN');
  await page.type("[placeholder='Last Name']", 'STEENBRUGGHEKY ');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  if (false) {
    await page.click(".personal-info-container .is-transparent span");
  }
  await page.type("#el-id-9261-947", 'israel');
  await page.click("#el-id-9261-1058 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-5134-938 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
}

async function Search_benerail_by_place_one_way(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click(".from-row [placeholder='Date']");
  await page.click("#el-id-3123-140");
  await page.click("[aria-label='Next Month']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await old2();
  await page.click(".search-btn");
}

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

