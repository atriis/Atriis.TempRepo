/*
 * Test Name: HYBRID for 26814 fusion meals (API Validation)
 * Description: 
 * Status: Active
 * Labels: hybrid,Flights,Fusion,Regression,Full Purchase,meal,2026 plan 2
 * Owner: Shani Hadar
 * Created: 2024-10-31T06:11:00Z
 * Updated: 2026-02-17T09:07:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('uzi@yonon.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('NBO', 'SHJ');
  await click_on_proceed_after_search();
  await waitForText(page, ".filter-name", 'Price');
  await filter_on_air_arabia();
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".app-label--quote", 'Pending booking');
  await scrollTo(page, 0, 612);
  await page.click(".flight-meals .is-clickable");
  await page.waitFor(500);
  await page.click(".inputs > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-6529-312", 'roasted');
  await page.click("#el-id-6529-259 > span");
  await page.waitFor(500);
  await page.click(".tabs-container .btn--primary");
  await Success_toast_alert();
  await waitForText(page, ".flight-meals .filled", 'check_circle');
  await page.click(".flight-meals .is-clickable");
  await waitForText(page, ".inputs > :nth-child(1) .el-select__placeholder span", 'Roasted Beef Panini - 20.00AED');
  await scrollTo(page, 0, 385);
  await set_CVV_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function filter_on_air_arabia() {
  await page.click("#el-id-3056-99");
  await page.type("#el-id-3056-99", 'Air Arabia');
  await page.waitFor(1000);
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function refresh_tab() {
  await page.reload();
}

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await waitForText(page, "[id='el-collapse-content-404'] .is-justify-content-space-between .label", 'Traveler Phone');
  await waitForText(page, ".email-input [type='text']", /@/);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__title", /Card verification/);
  await page.click(".success-message__email span");
  await page.waitFor(4000);
  await refresh_tab();
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
}

