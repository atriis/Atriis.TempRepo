/*
 * Test Name: 69688 Reference Field - 'At User Select' linked Reference Field
 * Description: 
 * Status: Active
 * Labels: Regression,Reference Fields,Corp RF,2026 plan 2
 * Owner: pini harush
 * Created: 2025-11-02T12:07:37Z
 * Updated: 2026-02-16T02:35:35Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Pini@tlgtest.im');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('lon', 'mad');
  await Validate_Atriis_pax();
  await Copy_of_Add_guest_Israel_Israeli();
  await Validate_Guest_pax();
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

async function Book_a_new_trip() {
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

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
  await page.click(".search-btn");
}

async function Validate_Atriis_pax() {
  await waitForText(page, ".traveler-section .label", /Reference Field - At User Select- par exist/);
  await page.click("[class^='mr'], [class*=' mr']");
}

async function Copy_of_Add_guest_Israel_Israeli() {
  await page.click(".add-btn .material-symbols-outlined");
  await waitForText(page, ".has-text-weight-semibold", 'Add traveller');
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
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Validate_Guest_pax() {
  await page.click(".search-btn");
  await waitForText(page, "[id='el-collapse-content-592'] .label", /Reference Field - At User Select- par not exist/);
}

