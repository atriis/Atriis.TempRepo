/*
 * Test Name: Test Case 71775: Amadeus NDC [OBT] (all carriers except BA & IB) - CVV not required when FOP credit card
 * Description: Clone: 
 * Status: Active
 * Labels: Amsalem,Amadeus NDC,FOP,credit card,Flights,Regression,Random CVV,CVV,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-12-22T05:24:10Z
 * Updated: 2025-12-22T06:26:09Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('cvvndc@corp.ams');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('LGA', 'CLT');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Search_flight_in_results_page('AA');
  await Copy_of_Add_to_trip_first_flight__NDC_content();
  await Validate_cvv_not_required__random_cvv_selected();
  await Validate_cvv_required__random_cvv_not_selected();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Finalize_booking();
  await Cancel_trip();
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

async function Book_a_new_trip() {
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

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Search_flight_in_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Copy_of_Add_to_trip_first_flight__NDC_content() {
  if (await getText(page, ".flight-list > :nth-child(1) .flight-info-top-bar > :nth-child(2) > :nth-child(2)") === "'NDC direct rate'") {
    await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  }
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Validate_cvv_not_required__random_cvv_selected() {
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Validate_cvv_required__random_cvv_not_selected() {
  await page.click(".is-justify-content-space-evenly .is-clickable");
  await waitForText(page, ".add-credit", 'add Add card details');
  await page.click(".select-credit-card > :nth-child(1) > :nth-child(2) > div:nth-of-type(2) .card-name > :nth-child(1)");
  await page.click(".btn-save");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.waitFor(2000);
  // Converting a 'negative-element-validation' step has to be done manually at this time
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

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Go_to_cart_when_pending_confirmation() {
  if (await getText(page, ".success-message__description") !== "'Your order has been processed, but some items are still being confirmed'") {
    return;
  }
  await page.click(".btn-container > :nth-child(1)");
}

async function Finalize_booking() {
  await waitForText(page, "h1", 'Booking details');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__description", 'Your order has been processed successfully');
  await Go_to_cart_when_pending_confirmation();
  await page.click(".btn-container > :nth-child(1)");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function Cancel_trip() {
  await waitForText(page, ".app-label--quote", 'Ticketing Complete');
  await Trip_Cancelation();
}

