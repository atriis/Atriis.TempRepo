/*
 * Test Name: 62109 - Search by schedule - Filters in results page updated according to displayed leg
 * Description: 
 * Status: Active
 * Labels: by schedule,Amadeus,multi city,Filters,Regression,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-05-15T08:54:12Z
 * Updated: 2025-11-25T02:03:15Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('filter@test.com');
  await New_Trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights();
  await Validate_filters_are_updated_according_to_leg();
  await Back_to_search_page();
  await Search_multi_city__by_schedule();
  await Validate_filters_are_updated_according_to_leg_1();
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

async function New_Trip() {
  await book_a_new_trip();
  await waitForText(page, ".advanced-search-container .el-checkbox__label", 'Allow nearby airports');
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

async function Search_flight_round_trip_by_schedule(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id*='id'] .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click(".search-btn");
}

async function Search_flights() {
  await Search_flight_round_trip_by_schedule('CPH', 'SEA');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
}

async function Validate_filters_are_updated_according_to_leg() {
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(1) .is-flex");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(3) .is-flex");
  await page.click(".el-radio-group > :nth-child(1) .is-flex");
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".flight-selected-segments");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(1) .is-flex");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(2) .is-flex");
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Back_to_search_page() {
  await page.click(".breadcrumb ul > li:nth-of-type(1) a");
  await waitForText(page, "[id='el-id-9140-719'] > :nth-child(1) .el-radio__label", 'Complete trip');
  //TODO Please add an assertion here
await isVisible(page, ".flight-form > :nth-child(2) > :nth-child(1)");
}

async function Copy_of_Search_multi_city_flight(firstFrom, firstTo, secondFrom, secondTo) {
  await page.click("[id='el-id-2216-47'] > :nth-child(3) .el-radio__label");
  await page.click(".add-flight-btn");
  await page.type("#el-id-2216-72", firstFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-73", firstTo);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-89", secondFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-90", secondTo);
  await page.click(".autocomplete-result");
  await page.click("#el-id-3588-795");
  await page.click("[id='el-id-3588-786'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-3588-814");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(5) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Search_multi_city__by_schedule() {
  await Copy_of_Search_multi_city_flight('CPH', 'SEA', 'LAX', 'CPH');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
}

async function Validate_filters_are_updated_according_to_leg_1() {
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(1) .is-flex");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(3) .is-flex");
  await page.click(".el-radio-group > :nth-child(1) .is-flex");
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".flight-selected-segments");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(1) .is-flex");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-4118-376'] > :nth-child(2) .is-flex");
  // Converting a 'validation-code-step' step has to be done manually at this time
}

