/*
 * Test Name: 57430 [Merge] Ypsilon - Aer Lingus - Baggages are displayed correctly in "Ancillary Services" and are being saved
 * Description: 
 * Status: Active
 * Labels: Ypsilon,Regression,Flights,baggage,ancillary,merge,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-01-30T07:24:17Z
 * Updated: 2025-02-17T05:59:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ypsilon@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('LHR', 'DUB');
  await Search_flight_results_page('EI');
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await waitForText(page, ".flight-ancillary-services .card-title", 'Ancillary Services');
  await page.click(".flight-ancillary-services .is-clickable");
  await waitForText(page, ".form-date-section > :nth-child(1) > :nth-child(2) .route", 'LHR-DUB');
  await page.waitForSelector(".form-date-section > :nth-child(1) > :nth-child(2) [alt='EI.gif']", {state: "visible"});
  await waitForText(page, ".form-date-section > :nth-child(1) > :nth-child(2) .carrier-name", 'Aer Lingus');
  await page.click(".form-date-section > :nth-child(1) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  //TODO Please add an assertion here
await getText(page, "#el-id-677-307 > span");
  await page.click("#el-id-677-255");
  await page.click(".form-date-section > :nth-child(1) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  //TODO Please add an assertion here
await getText(page, "#el-id-677-313 > span");
  await page.click("#el-id-677-261");
  await page.click(".tabs-container .btn--primary");
  await Pending_booking___wait_for_element_text();
  await waitForText(page, ".flight-ancillary-services .card-title", 'Ancillary Services');
  await page.click(".flight-ancillary-services .is-clickable");
  await waitForText(page, ".form-date-section > :nth-child(1) > :nth-child(2) .field span", firstFlight);
  await waitForText(page, ".form-date-section > :nth-child(1) > :nth-child(3) .field span", secondFlight);
  await Cancel_quote_from_cart_before_checkout();
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

async function Search_flight_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Cancel_quote_from_cart_before_checkout() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await page.click("[aria-label='Cancel item - '] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  if (false) {
    await page.click("body > :nth-child(12) .btn--primary");
  }
  if (false) {
    await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  }
  await page.click(".close-btn");
}

