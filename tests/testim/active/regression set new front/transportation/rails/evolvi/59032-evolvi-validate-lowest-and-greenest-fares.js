/*
 * Test Name: 59032 Evolvi- validate lowest and greenest fares
 * Description: validate display of greenest fare in results page and selection of this fare in cart page
 * Status: Active
 * Labels: Regression,Rail,Evolvi,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-03-03T03:05:42Z
 * Updated: 2025-07-28T10:17:12Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("thiagosantos@evolvi.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi__one_way_search_LON_to_LDS();
  await push_note();
  await Validate_lowest_and_greenest_fares();
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

async function UK_Rail__Evolvi__one_way_search_LON_to_LDS() {
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[aria-activedescendant='el-autocomplete-8871-item--1']", 'NCL');
  await page.waitFor(1000);
  await page.click("[id='el-id-2019-156-item-0'] .autocomplete-result-text");
  await page.type("[aria-activedescendant='el-autocomplete-6209-item--1']", 'LDS');
  await page.waitFor(1000);
  await page.click("[id='el-id-3128-129'] .autocomplete-result-text");
  await page.click("#el-id-5111-211");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function push_note() {
  if (!(await isVisible(page, ".el-dialog__title"))) {
    return;
  }
  await waitForText(page, ".el-dialog__title", 'Mandatory Notifications');
  await page.click(".el-checkbox__inner");
  await page.click(".btn--primary");
}

async function Verify_two_numbers_are_equal() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, "")); 
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = Math.abs(firstNumberParseFloat - secondNumberParseFloat) <= tolerance;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
  });
}

async function Verify_two_numbers_are_equal_1(firstValue, secondValue, tolerance) {
  await Verify_two_numbers_are_equal();
}

async function Validate_lowest_and_greenest_fares() {
  await page.hover(".green-bgd .amount");
  await waitForText(page, ".el-popper", 'The lowest carbon-efficient fare available');
  await page.click("[aria-describedby='el-id-1605-254'] .price-decimal");
  //TODO Please add an assertion here
await getText(page, ".results-header .blue-bgd .amount");
  await page.click(".selected-prices-container .btn");
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await Verify_two_numbers_are_equal_1(resultsPage, resultsCart, 0.09);
}

