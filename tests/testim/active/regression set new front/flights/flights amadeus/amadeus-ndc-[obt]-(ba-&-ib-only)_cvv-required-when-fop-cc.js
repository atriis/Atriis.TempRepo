/*
 * Test Name: 71774: Amadeus NDC [OBT] (BA & IB Only) - CVV required when FOP cc
 * Description: 
 * Status: Active
 * Labels: Amsalem,Amadeus NDC,FOP,credit card,Flights,Regression,Random CVV,CVV,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-12-21T02:06:37Z
 * Updated: 2025-12-21T03:42:23Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('cvvndc@corp.ams');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Copy_of_Search_flights_round_trip__with_preferred_carrier__up_to_1_stop('MAD', 'BOG', 'Iberia');
  await Copy_of_Add_to_trip_first_flight__NDC_content();
  await CVV_not_required__random_cvv_is_seelcted();
  await Select_different_cc__cvv_required__random_cvv_not_selected();
  await Set_cvv();
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

async function Copy_of_Search_flights_round_trip__with_preferred_carrier__up_to_1_stop(from, to, carrier) {
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
  //TODO Please add an assertion here
await isVisible(page, "[id='pane-flight'] .multi");
  await page.click(".flight-more-search-inputs > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6748-1121 > span");
  await page.click("#el-id-9370-1781");
  await page.type("#el-id-9370-1781", carrier);
  await page.click("#el-id-4594-1678 > span");
  //TODO Please add an assertion here
await isVisible(page, ".el-tag [xmlns='http://www.w3.org/2000/svg']");
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

async function Copy_of_Add_to_trip_first_flight__NDC_content() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  if (await getText(page, ".flight-list > :nth-child(1) .flight-info-top-bar > :nth-child(2) > :nth-child(2)") === "'NDC direct rate'") {
    await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  }
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function CVV_not_required__random_cvv_is_seelcted() {
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Select_different_cc__cvv_required__random_cvv_not_selected() {
  await page.click(".is-justify-content-space-evenly .is-clickable");
  await waitForText(page, ".add-credit", 'add Add card details');
  await page.click(".select-credit-card > :nth-child(1) > :nth-child(2) > div:nth-of-type(2) .card-name > :nth-child(1)");
  await page.click(".btn-save");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.waitFor(2000);
  //TODO Please add an assertion here
await isVisible(page, ".cvv-info-icon");
}

async function Set_cvv() {
  await page.click("#el-id-1836-951");
  await page.type("#el-id-1836-951", '123');
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

async function Finalize_booking() {
  await waitForText(page, "h1", 'Booking details');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__description", 'Your order has been processed successfully');
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

