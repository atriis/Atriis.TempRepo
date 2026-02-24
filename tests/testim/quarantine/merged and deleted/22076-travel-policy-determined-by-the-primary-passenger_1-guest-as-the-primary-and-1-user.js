/*
 * Test Name: 22076 travel policy determined by the primary passenger - 1 guest as the primary and 1 user
 * Description: travel policy determined by the primary passenger -1 guest as the primary and 1 user. for NL GOV
 * Status: Quarantine
 * Labels: Fit for Prod
 * Owner: Shani Hadar
 * Created: 2023-01-17T10:06:28Z
 * Updated: 2024-02-01T09:54:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Shani@Testimcorpnl.com');
  await book_a_new_trip();
  await add_guest_Israel_Israeli___user_group_addis_ababa();
  await Copy_of_add_second_traveler_by_name('gadi');
  await Search_for_hotel_1_night('london');
  await answer_ref_and_dynamic_fields_and_proceed();
  await page.click("[aria-describedby='el-tooltip-9748'] .ellipsis-txt");
  await page.hover("[aria-describedby='el-tooltip-1396']");
  await waitForText(page, "#el-tooltip-9044 > ul > li", /Hotel cost per night is greater than or equals 30 EUR/);
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
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

async function add_guest_Israel_Israeli___user_group_addis_ababa() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click("[role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.waitFor(500);
  await page.click(".copy-settings-container [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.type("[placeholder='First Name']", 'Israel');
  await page.type("[placeholder='Middle Name']", 'Yakov');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.click("[aria-label='Next Year']");
  await page.click(".el-year-table tbody > :nth-child(3) > td:nth-of-type(2) .cell");
  await page.click(".el-month-table tbody > :nth-child(1) > td:nth-of-type(1) .cell");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(1) span");
  await page.click("[placeholder='Nationality']");
  await page.type("[placeholder='Nationality']", 'isr');
  await page.click(".natinolity-add-guest .el-scrollbar__view > :nth-child(108)");
  await page.type("[placeholder='Enter email address']", 'israel@israeli.com');
  await page.type("[placeholder='Enter phone number']", '04-6548745');
  await page.click("[placeholder='Mobile / Business...']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".add-guest-btn");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Copy_of_add_second_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("h2");
  if (false) {
    await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  }
  if (false) {
    // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  }
  await page.waitFor(2000);
}

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_for_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function answer_ref_and_dynamic_fields_and_proceed() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("[name='Standplaats reisbeleid']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
}

