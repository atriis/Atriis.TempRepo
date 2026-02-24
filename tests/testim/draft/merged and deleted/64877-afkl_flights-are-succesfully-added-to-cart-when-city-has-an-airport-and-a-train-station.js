/*
 * Test Name: 64877 AFKL - Flights are succesfully added to cart when city has an airport and a train station
 * Description: 
 * Status: Draft
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2025-07-28T02:39:18Z
 * Updated: 2025-10-21T04:27:19Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunafranclub@tmcclubcorp.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Click_Allow_nearby_Airport();
  await Search_flights_round_trip('MST', 'PVG');
  await Making_sure_correct_city_pair_is_displayed();
  await Flight___Click__Pricing_Options_();
  await Adding_flight_from_pricing_option_to_cart();
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Click_Allow_nearby_Airport() {
  await page.click(".el-checkbox__inner");
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

async function Making_sure_correct_city_pair_is_displayed() {
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .flight-duration > :nth-child(1) .loc-code", 'MST');
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(3) .flight-duration > :nth-child(1) .loc-code", 'PVG');
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Click_on_proceed_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Adding_flight_from_pricing_option_to_cart() {
  await waitForText(page, "#tab-0 > div > div", /KLM/);
  await waitForText(page, "#tab-1 > div > div", /KLM/);
  await page.click(".pricing-options-section > :nth-child(1) .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".green");
  await page.waitFor(3000);
  await page.click(".pricing-options-section > :nth-child(2) .price-wrapper > :nth-child(2) .is-flex-direction-column");
  //TODO Please add an assertion here
await isVisible(page, "#tab-1 > div > div > div > span");
  await page.click(".add-btn");
  await Click_on_proceed_if_there_is_a_conflict_with_previous_trip();
  await Pending_Booking___Wait_for_element_text();
}

