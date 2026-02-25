/*
 * Test Name: 34382 Amadeus - Results are displayed with Pricing Options on search By Schedule
 * Description: 
 * Status: Active
 * Labels: Flights,Amadeus,Regression,No Amadeus Hotel Book,Search Flight,by schedule,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-08-10T09:17:07Z
 * Updated: 2025-08-07T04:15:17Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunasantosnl@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip_by_schedule('AMS', 'JFK');
  await click_on_proceed_after_search___warning_and_continue();
  await Adding_first_segment_from_Pricing_Options();
  await Adding_second_segment_from_Pricing_Options();
  await Results_are_displayed_in_Pricing_Page();
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

async function Search_flights_round_trip_by_schedule(from, to) {
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search___warning_and_continue() {
  await page.waitFor(1000);
  await proceed();
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Adding_first_segment_from_Pricing_Options() {
  await Flight___Click__Pricing_Options_();
  await page.click(".pricing-options-section > :nth-child(1) .desktop-btn");
  await waitForText(page, ".selected", 'Unselect');
  await page.click(".add-btn");
}

async function Adding_second_segment_from_Pricing_Options() {
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await Flight___Click__Pricing_Options_();
  await page.click("[aria-label='Pricing Options'] .flicking-camera > :nth-child(1) .btn--primary");
  await waitForText(page, ".selected", 'Unselect');
  await page.click(".add-btn");
}

async function Results_are_displayed_in_Pricing_Page() {
  await waitForText(page, "[class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

