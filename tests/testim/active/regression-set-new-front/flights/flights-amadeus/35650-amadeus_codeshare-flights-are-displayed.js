/*
 * Test Name: 35650 Amadeus - Codeshare flights are displayed
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,No Amadeus Hotel Book,Amadeus,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-09-08T09:11:19Z
 * Updated: 2025-02-03T09:10:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@prof.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way___specific_day__wednesday_('AMS', 'YMQ');
  await waitForText(page, ".flight-list > :nth-child(1) .add-to-trip", 'Add to trip');
  await Search_flight_results_page('DL');
  await waitForText(page, ".flight-list > :nth-child(1) .flight-operator", /Operated by/);
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await waitForText(page, ".el-drawer__open .flight-operator", /Operated by/);
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

async function Search_flights_one_way___specific_day__wednesday_(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function Search_flight_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

