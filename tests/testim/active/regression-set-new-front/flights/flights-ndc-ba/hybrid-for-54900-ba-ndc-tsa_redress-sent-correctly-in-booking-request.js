/*
 * Test Name: Hybrid for 54900 BA NDC -TSA / Redress sent correctly in booking request
 * Description: Merged with 54900
 * Status: Active
 * Labels: BA NDC Regression,APIS,Search Flight,Flights,Cart,2026 plan 2
 * Owner: Noam Miller
 * Created: 2024-11-26T11:15:01Z
 * Updated: 2025-11-25T08:31:39Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('tsa@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('LHR', 'PHL');
  await Add_to_trip_flight();
  await Destination_address_mandatory();
  await Checkout_and_complete_booking();
  await Trip_Cancelation();
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

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Destination_address_mandatory() {
  if (true) {
    return;
  }
  await scrollTo(page, 0, 545);
  //TODO Please add an assertion here
await isVisible(page, ".flight-passenger-info .has-text-danger");
  //TODO Please add an assertion here
await isVisible(page, ".eu-rail-date-of-birth .has-text-danger");
  await page.click(".flight-passenger-info .is-clickable");
  await waitForText(page, "[id='pane-1730564'] > :nth-child(2) > :nth-child(1) .label", 'Select passport');
  await scrollToElement(page, ".tabs-container .btn--primary");
  await page.click(".tabs-container .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".is-12 .el-input");
  await page.click("#el-id-8634-1297");
  await page.type("#el-id-8634-1297", 'Willis Hotel Brooklyn');
  await page.click("#el-id-8634-1298");
  await page.type("#el-id-8634-1298", 'New York');
  await page.click("[id='pane-1832414'] > :nth-child(7) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-8634-1299", 'United States');
  await page.click("#el-id-8634-1271");
  await page.click("[id='pane-1832414'] > :nth-child(7) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-8634-1300", 'New York');
  await page.click("#el-id-8634-1336");
  await page.click("#el-id-8634-1301");
  await page.type("#el-id-8634-1301", '12121');
  await page.click(".tabs-container .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".flight-passenger-info .filled");
}

async function Checkout_and_complete_booking() {
  await page.click(".el-checkbox__inner");
  await page.click("[id='pane-overview'] .btn--default");
  await page.waitForSelector(".el-tabs [draggable='true']", {state: "visible"});
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

