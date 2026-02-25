/*
 * Test Name: 33896 Benerail - Can save date of birth in case of guest/pax without DOB
 * Description: 
 * Status: Active
 * Labels: guest,Rail,Cart,Regression,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-22T01:23:38Z
 * Updated: 2026-02-03T10:49:44Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('beny@Testimcorpnl.com');
  await book_a_new_trip();
  await add_guest_Israel_Israeli_without_date_of_birth();
  await choose_age_youth();
  await Search_benerail_by_place('BEBMI', 'NLABK');
  await fill_reference_and_dynamic_fields();
  await add_benerail_2_ways_from_search_results_to_cart();
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(1) .btn", 'Fare Rules');
  await scrollTo(page, 0, 720);
  await waitForText(page, ".eu-rail-date-of-birth .card-title", '*        Birth Date');
  await save_birth_date_in_cart();
  await validate_saved();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
}

async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
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

async function add_guest_Israel_Israeli_without_date_of_birth() {
  await page.click(".add-btn .is-flex");
  await page.click(".add-guest-btn");
  if (false) {
    await page.click("[role='radiogroup'] > :nth-child(2) .el-radio__inner");
  }
  if (false) {
    await page.waitFor(500);
  }
  if (false) {
    await page.click(".copy-settings-container [type='text']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  }
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-6155-920 > span");
  await page.type("[placeholder='First Name']", 'Israel');
  await page.type("[placeholder='Middle Name']", 'Yakov');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click(".personal-info-container .is-transparent span");
  await page.type("#el-id-6155-954", 'israel');
  await page.click("#el-id-6155-1065 > span");
  await page.type("[placeholder='Enter email address']", 'israel@israeli.com');
  await page.type("[placeholder='Enter phone number']", '04-654-8745');
  await page.click(".contact-info-container [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6155-943 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function choose_age_youth() {
  await page.click(".el-tabs__header [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8147-23 > span");
  await waitForText(page, "h6", 'Travellers Ages');
  await page.click(".travelers-ages-row [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8147-680 > span");
}

async function Click() {
  if (true) {
    return;
  }
  const boolean_51 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_51) {
    await page.click("[aria-label='Next Month']");
  }
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
  await sendSpecialCharacter(page, ".from-row [placeholder='Date']", 'Enter');
  await page.click(".to-row [placeholder='Date']");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".to-row [placeholder='Date']", returnDate);
  await sendSpecialCharacter(page, ".to-row [placeholder='Date']", 'Enter');
}

async function Search_benerail_by_place(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.type("[placeholder='From... Station or Location']", from);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.type("[placeholder='To... Station or Location']", to);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.click(".from-row [placeholder='Date']");
  await page.click("[id='el-id-7687-293'] [aria-label='Next Month']");
  await page.click("[id='el-id-7687-293'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-7687-405");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    await page.click(".from-row [placeholder='Date']");
  }
  if (false) {
    //TODO Please add an assertion here
await getText(page, "[x-placement='bottom-start'] .el-date-picker__header");
  }
  await Click();
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(4)");
  }
  if (false) {
    await page.click(".to-row [placeholder='Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(5)");
  }
  await page.click(".search-btn");
  await old2();
}

async function fill_reference_and_dynamic_fields() {
  await page.waitFor(3000);
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Travel Profile Questions');
  await page.click(".general-questions > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8147-771 > span");
  await page.click("body > :nth-child(17) .btn--primary");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_benerail_2_ways_from_search_results_to_cart() {
  await page.waitForSelector(".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", {state: "visible"});
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await page.click(".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']");
  await page.waitFor(3000);
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function save_birth_date_in_cart() {
  await page.click(".eu-rail-date-of-birth .is-clickable");
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.click("[aria-label='Previous Year']");
  await page.click("[aria-label='Previous Year']");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(4) span");
  //TODO Please add an assertion here
await getText(page, "[placeholder='DD/MM/YYYY']");
  await page.click(".tabs-container .no-border");
}

async function validate_saved() {
  await page.waitFor(1000);
  await waitForText(page, ".eu-rail-date-of-birth .material-symbols-outlined", 'check_circle');
  await page.click(".eu-rail-date-of-birth .is-clickable");
  await waitForText(page, "[placeholder='DD/MM/YYYY']", value);
}

