/*
 * Test Name: 22914 MERGED Parallel search flight with edited Car + reference and dynamic fields on search are taken from the primary traveler (booker) + best sorting explanation
 * Description: 
 * Status: Active
 * Labels: Parallel,Flights,Cars,Regression,No Amadeus Hotel Book,Dynamic fields,Reference Fields,NL government,Search Flight,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-12-21T11:33:53Z
 * Updated: 2026-02-10T05:14:42Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com/");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flight_and_edit_car('LON', 'TLV');
  await validate_fields();
  await validate_content();
  await validate_noneditable();
  await validate_mandatory();
  await validate_can_proceed();
  await waitForText(page, ".origin-info > :nth-child(1)", 'London (LON)');
  await waitForText(page, ".origin-info > :nth-child(3)", 'Tel Aviv       (TLV)');
  await page.click(".edit-search-btn");
  await waitForText(page, "[placeholder='Depart Date']", flight_date_from_entered);
  await waitForText(page, "[placeholder='Return Date']", flight_date_to_entered);
  await page.click(".close-btn");
  await page.hover(".tooltip-img");
  await waitForText(page, "#el-tooltip-8484", 'Best calculates the most suitable option for you based on specified settings for price, travel time, number of stops, and preferred airlines, which reflect your corporate preferences.');
  await Copy_of_Add_flight_from_results_page_to_cart();
  await waitForText(page, "b", /car hire/);
  await waitForText(page, ".locations .ellipsis-txt", 'Madrid,Spain,(MAD)');
  await page.click(".edit-search-btn");
  await waitForText(page, "[placeholder='Pick-up Date']", car_date_from_entered);
  await waitForText(page, "[placeholder='Drop-off Date']", car_date_to_entered);
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

async function Search_flight_and_edit_car(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.type("[placeholder='From... Departure']", 'LON');
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  await page.type("[placeholder='To... Destination']", 'TLV');
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Depart Date']");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Return Date']");
  await page.click("[class^='my'], [class*=' my'] .control > :nth-child(2) .el-checkbox__inner");
  await page.click("[class^='my'], [class*=' my'] .control > :nth-child(2) .btn span");
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[aria-activedescendant='el-autocomplete-2467-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2467-item--1']", '');
  await page.waitFor(3000);
  await page.click("[aria-activedescendant='el-autocomplete-2467-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2467-item--1']", 'MAD');
  await page.click("[id='el-id-761-917-item-0'] .has-text-weight-bold");
  if (false) {
    await page.click("[id='pane-flight'] [placeholder='Pick-up Time']");
  }
  if (false) {
    await page.click("[id='el-id-6418-921'] .btn-apply");
  }
  if (false) {
    await page.click("[id='pane-flight'] [placeholder='Drop-off Time']");
  }
  if (false) {
    await page.click("[id='el-id-6418-956'] .btn-apply");
  }
  await page.click(".trip-search-control");
  await page.type("#el-id-6015-990", FromCar);
  await sendSpecialCharacter(page, "#el-id-6015-990", 'Enter');
  await page.click("[id='pane-flight'] [placeholder='Drop-off Date']");
  await page.type("[id='pane-flight'] [placeholder='Drop-off Date']", toCar);
  await sendSpecialCharacter(page, "[id='pane-flight'] [placeholder='Drop-off Date']", 'Enter');
  await page.click(".trip-search-control");
  //TODO Please add an assertion here
await getText(page, "[id='pane-flight'] [placeholder='Pick-up Date']");
  //TODO Please add an assertion here
await getText(page, "[id='pane-flight'] [placeholder='Drop-off Date']");
  await page.click(".search-btn");
}

async function validate_fields() {
  await waitForText(page, "[id='el-collapse-content-1418'] .label", '*Soort reis/Type of tripinfo');
  await waitForText(page, "[id='el-collapse-content-9289'] .general-questions > :nth-child(1) .label", 'Type of travellerinfo');
  await waitForText(page, "[id='el-collapse-content-9289'] .general-questions > :nth-child(2) .label", '*Location travel policyinfo');
  await waitForText(page, "[id='el-collapse-content-9289'] .general-questions > :nth-child(3) .label", 'Locationinfo');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, "[id='el-collapse-content-996'] .control span", 'Select');
  await waitForText(page, "[id='el-collapse-content-997'] .general-questions > :nth-child(1) .control span", 'Select');
  await waitForText(page, "[title='568027'] span", 'Caribbean');
  await waitForText(page, "[id='el-collapse-content-997'] .general-questions > :nth-child(3) .control span", 'Select');
}

async function validate_noneditable() {
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

async function validate_mandatory() {
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".help", 'This field is required');
}

async function validate_can_proceed() {
  await page.click("[id='el-collapse-content-996'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8411-1002 > span");
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".filter-name", 'Price');
}

async function Copy_of_click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "'      Proceed    '") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Copy_of_Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .is-hidden-mobile");
  await Copy_of_click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

