/*
 * Test Name: 63463 - Search by schedule - Display agreement/ptc fare tag in pricing page
 * Description: 
 * Status: Active
 * Labels: Amadeus,Flights,uniglobe,Agreement,by schedule,Regression,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-06-12T08:04:55Z
 * Updated: 2025-09-16T06:50:13Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('agreement@fare.uni');
  await New_Trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip_by_schedule__with_carrier('EWR', 'CPH', 'Scandinavian');
  await Select_flights__agreement_fare();
  await Pricing_Page___Agreement_indication_displayed();
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

async function New_Trip() {
  await Book_a_new_trip();
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

async function Search_flights_round_trip_by_schedule__with_carrier(from, to, carrier) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id='el-id-520-61'] .arrow-right");
  await page.click("[id='el-id-520-61'] .is-right tbody > :nth-child(4) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click("[class^='mt'], [class*=' mt']");
  //TODO Please add an assertion here
await isVisible(page, ".flight-more-search-inputs > :nth-child(2)");
  await page.click(".flight-more-search-inputs > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6905-1070");
  await page.click("[id='pane-flight'] .is-filterable");
  await page.type("#el-id-8998-883", carrier);
  await page.click("[id*='id'] span");
  //TODO Please add an assertion here
await isVisible(page, ".el-tag [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function Select_flights_from_results__by_schedule_() {
  await Flight___Results___Wait_for__Select__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await Flight___Results___Wait_for__Select__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
}

async function Select_flights__agreement_fare() {
  await Select_flights_from_results__by_schedule_();
}

async function Pricing_Page___Agreement_indication_displayed() {
  await waitForText(page, ".pricing-options-container > :nth-child(1) .btn--primary", 'Add to trip');
  //TODO Please add an assertion here
await isVisible(page, ".pricing-options-container > :nth-child(1) [draggable='true']");
}

