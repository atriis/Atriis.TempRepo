/*
 * Test Name: 69605: Search flights by preferred carrier
 * Description: 
 * Status: Active
 * Labels: Club,Sabre,Search Flight,carrier,Complete trip,by schedule,Daily Flights,Flights,Regression,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-10-30T05:41:06Z
 * Updated: 2026-02-17T08:55:24Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('tripstatus@app.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip__with_preferred_carrier('SYD', 'MEL', 'Qantas');
  await Validate_results_displayed__filtered_by_preferred_carrier();
  await Back_to_search_page();
  await Validate_results_displayed__by_schedule_with_preferred_carrier();
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

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
  }, selector);
}

async function scrollToElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, selector);
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

async function old_date_picker() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Depart Date']");
  await page.type("[placeholder='Depart Date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Depart Date']", 'Enter');
  await page.click("[placeholder='Return Date']");
  await page.type("[placeholder='Return Date']", returnDate);
  await sendSpecialCharacter(page, "[placeholder='Return Date']", 'Enter');
  await page.click(".trip-search-control");
}

async function Search_flights_round_trip__with_preferred_carrier(from, to, carrier) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  if (false) {
    await page.waitFor(500);
  }
  if (false) {
    await page.click("#el-id-4704-692-item-0 > div");
  }
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  if (false) {
    await page.click(".ellipsis");
  }
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await old_date_picker();
  await page.click("[class^='mt'], [class*=' mt']");
  //TODO Please add an assertion here
await isVisible(page, "[id='pane-flight'] .multi");
  await page.click("#el-id-9370-1781");
  await page.type("#el-id-9370-1781", carrier);
  await page.click("#el-id-9370-1619");
  //TODO Please add an assertion here
await isVisible(page, ".el-tag [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".search-btn");
}

async function All_results_are_the_preferred_carrier_from_search() {
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .carrier-container", /QF/);
}

async function Validate_results_displayed__filtered_by_preferred_carrier() {
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  //TODO Please add an assertion here
await isElementChecked(page, "[id='el-id-7000-846'] > :nth-child(3) .el-checkbox__input");
  await All_results_are_the_preferred_carrier_from_search();
}

async function Back_to_search_page() {
  await scrollToElement(page, ".breadcrumb ul > li:nth-of-type(1) a");
  await page.click(".breadcrumb ul > li:nth-of-type(1) a");
  await waitForText(page, "[class^='is-flex-grow'], [class*=' is-flex-grow'] > div:nth-of-type(2) .el-checkbox__label", 'Allow nearby airports');
}

async function All_results_are_the_preferred_carrier_from_search_1() {
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .carrier-container", /UA/);
}

async function All_results_are_the_preferred_carrier_from_search_2() {
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .carrier-container", /UA/);
}

async function Validate_results_displayed__by_schedule_with_preferred_carrier() {
  await page.type("#el-id-8231-1818", 'LAX');
  await page.click("[id='el-popper-container-8231'] .has-text-weight-bold");
  await page.type("#el-id-8231-1823", 'DEN');
  await page.click("[id='el-id-8231-1053-item-0'] .has-text-weight-bold");
  await page.click("[id='el-id-8231-1816'] > :nth-child(2) .el-radio__label");
  await page.click(".el-tag [fill='currentColor']");
  await page.click("#el-id-8231-1829");
  await page.type("#el-id-8231-1829", 'United');
  await page.click("#el-id-8231-1578 > span");
  await page.click(".btn--primary");
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  if (await getText(page, ".carriers-filter .view-more-btn") === "'View more'") {
    await page.click(".carriers-filter .view-more-btn");
  }
  //TODO Please add an assertion here
await isElementChecked(page, "[id='el-id-8231-1962'] > :nth-child(5) .el-checkbox__input");
  await All_results_are_the_preferred_carrier_from_search_1();
  await scrollToElement(page, ".flight-list > :nth-child(2) .btn--primary");
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  //TODO Please add an assertion here
await isElementChecked(page, "[id='el-id-8231-1962'] > :nth-child(5) .el-checkbox__input");
  await All_results_are_the_preferred_carrier_from_search_2();
}

