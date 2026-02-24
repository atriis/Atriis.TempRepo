/*
 * Test Name: 55056 Amadeus - Split rules - After adding 2 different round trip flights and then holding them, the split rule configuration is applied correctly
 * Description: 
 * Status: Active
 * Labels: Regression,Amadeus,split ticket,split rules,Flights,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-12-03T11:24:42Z
 * Updated: 2025-09-14T09:38:19Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip__clicking__Complete_trip__('NYC', 'DFW');
  await Search_flight_results_page('UA');
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await scrollToElement(page, ".terms");
  await page.click(".el-checkbox__inner");
  await Hold_flight();
  await page.click(".flicking-camera > :nth-child(1) .icon-text");
  await waitForText(page, "[id^='el-id'] > :nth-child(1) .el-radio__label", 'Complete trip');
  await page.click("[id^='el-id']");
  await page.click("[id^='el-id'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".is-closable [xmlns='http://www.w3.org/2000/svg']");
  await page.type("[id^='el-id']", 'american airlines (AA)');
  await page.click("[id^='el-id']");
  await page.type("#el-id-6637-1674", 'LAX');
  await page.click(".autocomplete-result");
  await page.waitFor(3000);
  await page.click("[id='el-id-668-2479'] > :nth-child(1) .el-radio__label");
  await page.click(".btn--size-large");
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
  await Search_flight_results_page('AA');
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".pending-booking", 'Pending booking');
  await page.click(".el-checkbox__inner");
  await page.click(".last-quote .btn--default");
  await waitForText(page, ".last-quote .has-text-weight-bold", 'On hold');
  await scrollToElement(page, ".last-quote .pnr-code");
  await waitForText(page, ".last-quote .pnr-code", /PNR/);
  await scrollToElement(page, "[islastquote='false'] .pnr-code");
  await waitForText(page, "[islastquote='false'] .pnr-code", /PNR/);
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

async function Search_flights_round_trip__clicking__Complete_trip__(from, to) {
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
  await page.type("#el-id-8119-872", 'United (UA)');
  await page.click("[id^='el-id']");
  await page.click("[id^='el-id'] > :nth-child(1) .el-radio__label");
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

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function Hold_flight() {
  await page.click(".quote-card .btn--default");
  await page.waitFor(4500);
  await Price_change_prompt();
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

