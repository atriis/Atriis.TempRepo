/*
 * Test Name: 46669 Reset stop filter when no results found according to search criteria
 * Description: 
 * Status: Active
 * Labels: NL government,search,Filters,Regression,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-05-29T07:50:16Z
 * Updated: 2025-11-25T11:31:22Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('resetFilter@nl.gov');
  await book_a_new_trip();
  await Search_Flights();
  await Search_Flights_up_to_1_stop__validate_filter_reset();
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function Search_Flights() {
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", 'BOI');
  await sendSpecialCharacter(page, "#el-id-7371-52", 'Tab');
  await page.type("#el-id-7371-53", 'LEJ');
  await sendSpecialCharacter(page, "#el-id-7371-53", 'Tab');
  await page.click("[placeholder='Depart Date']");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-4578-38 > div > div > div");
  await page.click("[data-popper-placement='top'] .arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[data-popper-placement='top'] .is-left tbody > :nth-child(4) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click("[data-popper-placement='top'] .end-date .el-date-table-cell__text");
  await page.click(".search-btn");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.waitForSelector("[role='alert']", {state: "visible"});
  await waitForText(page, "[role='alert'] p", 'No results found according to your search criteria, search parameters have been reset');
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  //TODO Please add an assertion here
await isVisible(page, ".el-table__body-wrapper tbody > :nth-child(3) .el-table_1_column_2 .cell-price");
}

async function Search_Flights_up_to_1_stop__validate_filter_reset() {
  await page.click(".edit-search-btn");
  await waitForText(page, ".advanced-search-container .el-checkbox__label", 'Allow nearby airports');
  await page.click("[class^='pl'], [class*=' pl']");
  await waitForText(page, ".flight-more-search-inputs > :nth-child(1) .el-select__placeholder", 'Up to two stops');
  await page.click(".flight-more-search-inputs > :nth-child(1) .el-input");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.type("[placeholder='From... Departure']", 'SEA');
  await page.click("[id='el-autocomplete-6120-item-0'] .has-text-weight-bold");
  await page.click(".search-btn");
  await page.waitFor(2000);
  await page.waitForSelector("[role='alert']", {state: "visible"});
  await waitForText(page, "[role='alert'] p", 'No results found according to your search criteria, search parameters have been reset');
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  //TODO Please add an assertion here
await isVisible(page, ".el-table__body-wrapper .lowest-fare .cell-price");
  //TODO Please add an assertion here
await isVisible(page, ".el-table__body-wrapper tbody > :nth-child(3) .el-table_1_column_2 .cell-price");
}

