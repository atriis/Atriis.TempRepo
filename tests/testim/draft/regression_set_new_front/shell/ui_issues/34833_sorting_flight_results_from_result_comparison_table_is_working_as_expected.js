/*
 * Test Name: 34833 Sorting flight results from result comparison table is working as expected
 * Description: this is too unstable, I need to talk to someone 
 * Status: Draft
 * Labels: Flights,UI,No Amadeus Hotel Book
 * Owner: Bruna Santos
 * Created: 2023-08-17T03:26:59Z
 * Updated: 2025-07-16T05:11:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimendes@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('TLV', 'JFK');
  //TODO Please add an assertion here
await getText(page, "[aria-checked='true'] .el-radio-button__inner > :nth-child(2)");
  await page.click(".el-table__body-wrapper .lowest-fare .cell-price");
  //TODO Please add an assertion here
await getText(page, "[aria-checked='true'] .el-radio-button__inner > :nth-child(2)");
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .amount");
  await Comparing_two_values_to_see_if_they_are_equal(firstValue, secondValue);
  await Check_if_there_is_only_Swiss_Airline_carrier_on_search_results_page();
  //TODO Please add an assertion here
await isElementChecked(page, ".carriers-filter [role='group'] > :nth-child(2)");
  //TODO Please add an assertion here
await isElementChecked(page, ".app-filter__content > :nth-child(4) [role='group'] > :nth-child(2)");
  await page.click(".el-table__body-wrapper .selected-cell > :nth-child(2)");
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .amount");
  await Comparing_two_best_values_to_see_if_they_are_equal(valueBest, valueBest_Second);
  //TODO Please add an assertion here
await isElementChecked(page, ".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__input");
  //TODO Please add an assertion here
await isElementChecked(page, ".carriers-filter [role='group'] > :nth-child(4) .el-checkbox__input");
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

async function Search_flights_round_trip(from, to) {
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
  await page.click(".search-btn");
}

async function Comparing_two_values_to_see_if_they_are_equal(firstValue, secondValue) {
  await page.evaluate((firstValue, secondValue) => {
    var equal = firstValue === secondValue;
    
    if(!equal){
        throw new Error("Values are different, first value is " + firstValue + " and second value is " + secondValue)
    }
    else{
        console.log("Values are equal")
    }
  }, firstValue, secondValue);
}

async function Check_if_there_is_only_Swiss_Airline_carrier_on_search_results_page() {
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .carrier-name", /(Swiss|United|Air Canada|Lufthansa|Air France|Emirates|Delta|Virgin Atlantic)/);
}

async function Comparing_two_best_values_to_see_if_they_are_equal(valueBest, valueBest_Second) {
  await page.evaluate((valueBest, valueBest_Second) => {
    var equal = valueBest === valueBest_Second
    
    if(!equal){
        throw new Error("Values are different, first value is " + valueBest + " and second value is " + valueBest_Second)
    }
    else{
        console.log("Values are equal")
    }
  }, valueBest, valueBest_Second);
}

