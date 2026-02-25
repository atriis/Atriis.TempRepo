/*
 * Test Name: 32980 By Schedule: Edit search from pricing page works as expected
 * Description: 
 * Status: Active
 * Labels: Flights,Adding Passengers,Amadeus,Regression,No Amadeus Hotel Book,Search Flight,by schedule,67304,2026 plan 1
 * Owner: Noam Miller
 * Created: 2023-07-04T12:24:40Z
 * Updated: 2025-09-18T11:46:52Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('testim@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flight_round_trip_by_schedule('JFK', 'ATL');
  await waitForText(page, ".flight-list > :nth-child(1) .is-hidden-mobile", 'Select');
  await By_Schedule_Select_Flights();
  await Edit_search_from_pricing_page();
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

async function By_Schedule_Select_Flights() {
  await page.click(".carriers-filter [role='group'] > :nth-child(1) .el-checkbox__inner");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await page.click(".carriers-filter [role='group'] > :nth-child(3) .el-checkbox__inner");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".add-btn", 'Add to trip');
}

async function Edit_search_from_pricing_page() {
  await page.click(".edit-search-btn");
  // Converting a 'drag' step has to be done manually at this time
  await page.type("[placeholder='To... Destination']", 'Savannah');
  await page.click("[id='el-autocomplete-7443-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='Depart Date']");
  await page.click(".is-left tbody > :nth-child(6) > td:nth-of-type(1) .el-date-table-cell__text");
  await page.click(".is-left tbody > :nth-child(6) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[class^='my'], [class*=' my'] > :nth-child(2) .el-checkbox__inner");
  await page.click(".search-btn");
  await waitForText(page, ".carriers-filter h4", 'Preferred airlines');
  await waitForText(page, "[aria-describedby='el-tooltip-7453']", /SAV/);
}

