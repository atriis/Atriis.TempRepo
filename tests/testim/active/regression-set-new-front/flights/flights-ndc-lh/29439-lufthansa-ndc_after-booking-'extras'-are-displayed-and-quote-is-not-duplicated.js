/*
 * Test Name: 29439 Lufthansa NDC - After booking, 'Extras' are displayed and quote is not duplicated
 * Description: 
 * Status: Active
 * Labels: Flights,Extras,Pre Prod,Sanity,Lufthansa NDC Regression,Full Purchase,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-12-21T09:50:22Z
 * Updated: 2025-10-21T10:48:40Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("claraaguiar@ndclhclara.com");
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_one_way("MUC", "FRA");
  await add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await accept_and_proceed_to_checkout();
  await Booking_and_finalizing();
  await Flights___Trip_Overview___Wait_for__Flight_details__text_display();
  await Extras_are_displayed_after_booking();
  await Quote_is_not_duplicated_after_booking();
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

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
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

async function accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Booking_and_finalizing() {
  await page.waitFor(10000);
  await Price_change_prompt();
  await book_and_finalize();
}

async function Flights___Trip_Overview___Wait_for__Flight_details__text_display() {
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Extras_are_displayed_after_booking() {
  await page.click(".el-collapse-item__arrow");
  await waitForText(page, ".flight-optional-services .card-title", 'Optional Services');
  await page.click("#el-collapse-head-345 > i > svg");
}

async function List_length__with_css_locator_as_parameter_(length, locator) {
  await page.evaluate((length, locator) => {
    const expectedLength = Number(length); // Replace 'length' with the expected number of visible elements
    
    // Convert NodeList to an array, ensure exact matches, and filter for visible elements
    const elements = Array.from(document.querySelectorAll(locator))
      .filter(el => el.matches(locator)) // Ensure the element exactly matches the locator
      .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)); // Robust visibility check
    
    // Validate the number of visible and exact match elements
    if (elements.length === expectedLength) {
      console.log(`The element appears ${elements.length} times and is visible.`);
    } else {
      throw new Error(`Assertion failed: Expected ${expectedLength} visible elements, but found ${elements.length}.`);
    }
    
  }, length, locator);
}

async function Quote_is_not_duplicated_after_booking() {
  await List_length__with_css_locator_as_parameter_('1', '.ticket-layout-container.is-flex.is-flex-direction-column.confirmed');
}

