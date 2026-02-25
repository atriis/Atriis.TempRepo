/*
 * Test Name: 60539 Amtrak search form validations
 * Description: validate all the search params
 * Status: Active
 * Labels: search,Regression,Amtrak Sabre,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-04-03T11:10:53Z
 * Updated: 2025-12-23T03:42:20Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bar@amtrak.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Amtrak_search_round_trip('NYP', 'WAS');
  await Validating_TIME__from_();
  await Validating_TIME__to_();
  await Adding_second_traveler_through_search_form();
  await __Promo_Code();
  await Adding_traveler_detail();
  await Copy_of_add_guest_Israel_Israeli();
  await Adding_valid_Promo_Code();
  await Search_results_are_displayed();
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

async function refresh_tab_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await page.reload();
}

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Amtrak_search_round_trip(fromStation, toStation) {
  await page.click(".el-tabs__header .el-input");
  await page.click("#el-id-3445-21");
  await page.type("#el-id-6985-370", fromStation);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.type("#el-id-6985-374", toStation);
  await page.click("[id='el-id-6985-325-item-0'] p");
  await page.click("#el-id-530-375");
  await page.click("#el-id-530-296 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("[id='el-id-530-296'] tbody > :nth-child(3) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-530-379");
  await page.click("[id='el-id-530-331'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
}

async function Validating_TIME__from_() {
  await page.click("#el-id-6326-64");
  await page.click("#el-id-8632-395");
  await page.click("[id='el-id-8632-396'] [name='hours'] .el-select__placeholder");
  await page.click("#el-id-8632-400 > span");
  await page.click("[id='el-id-8632-396'] [name='minutes'] span");
  await page.click("#el-id-8632-425 > span");
  await waitForText(page, "#el-id-6326-64", '01:00');
}

async function Validating_TIME__to_() {
  await page.click("#el-id-6326-99");
  await page.click("[id='el-id-8632-529'] [name='hours'] .el-select__placeholder");
  await page.click("#el-id-766-351 > span");
  await waitForText(page, "#el-id-6326-99", '02:00');
}

async function Adding_second_traveler_through_search_form() {
  await page.click("[id='pane-rails'] .space-between [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] span");
  await waitForText(page, ".has-text-weight-semibold", 'Add traveller');
}

async function __Promo_Code() {
  await page.type("#el-id-8378-379", '123');
  await waitForText(page, ".help", 'Promo Code must be 4 characters');
}

async function Adding_traveler_detail() {
  await page.click(".rows [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8378-382 > span");
}

async function Copy_of_add_guest_Israel_Israeli() {
  await page.click(".traveler-name");
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
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.click(".show-year-arrows [aria-label='Previous Year']");
  await page.click(".show-year-arrows tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".personal-info-container .is-transparent span");
  await page.type("#el-id-6155-954", 'israel');
  await page.click("#el-id-6155-1065 > span");
  await page.type("[placeholder='Enter email address']", 'israel@israeli.com');
  await page.type("[placeholder='Enter phone number']", '04-654-8745');
  await page.click(".contact-info-container [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6155-943 > span");
  await page.click(".add-guest-btn");
  await waitForText(page, "[id='pane-rails'] .is-transparent span", 'Select a loyalty card');
}

async function Adding_valid_Promo_Code() {
  await page.type("#el-id-8378-379", '1234');
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Trip_reference_fields_after_search() {
  await page.click(".el-collapse-item__wrap [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1044-415 > span");
  if (false) {
    await page.type("#el-id-766-703", 'business');
  }
  await Click_on_proceed_after_search();
}

async function Amtrak___Results___Wait_for__Select__text() {
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--primary", 'Select');
}

async function Search_results_are_displayed() {
  await page.click(".btn--primary");
  await Trip_reference_fields_after_search();
  await Amtrak___Results___Wait_for__Select__text();
}

