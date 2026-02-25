/*
 * Test Name: 55700 - Galileo NDC - AA, Search by schedule, booked as separate tickets
 * Description: 
 * Status: Active
 * Labels: Gray Dawes,Galileo NDC,Flights,Fare Rules,Regression,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-12-22T08:12:19Z
 * Updated: 2025-11-26T06:53:20Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('corpNDC@gdg.com');
  await New_Trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights__by_schedule();
  await Search_flight_in_results_page('AA');
  await Fare_rules__Brand_info_in_results();
  await Select_flights_from_results__by_schedule_search__separated_tickets();
  await Validate_separate_tickets_in_cart_and_checkout();
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

async function New_Trip() {
  await book_a_new_trip();
  //TODO Please add an assertion here
await isVisible(page, ".flight-form > :nth-child(2) .is-flex-direction-column");
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

async function Search_flights_round_trip__by_schedule_(from, to) {
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

async function Search_flights__by_schedule() {
  await Search_flights_round_trip__by_schedule_('LAX', 'DFW');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
}

async function Search_flight_in_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function Validate_NDC_content() {
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-top-bar .is-align-items-center > :nth-child(2)", 'NDC direct rate');
}

async function Fare_rules__Brand_info_in_results() {
  await Validate_NDC_content();
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await waitForText(page, "[aria-label='Flight details'] .price-wrapper > :nth-child(1)", 'Total price');
  //TODO Please add an assertion here
await getText(page, "[class^='m'], [class*=' m']");
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#el-id-4595-267", 'Branded fares');
  await waitForText(page, "[aria-label='Branded fares'] h4", brandName);
  await waitForText(page, ".brand-services > :nth-child(2)", /^(?!.*Brand information is currently unavailable).*/);
  await page.click("[aria-label='Branded fares'] [aria-label='Close this dialog']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.click("#logged-in-page > div > section > section > main > section > main > section > div:nth-child(3) > div > header > button > i > svg > path");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.click(".flight-list > :nth-child(1) .fare-rules-btn");
  await waitForText(page, ".fare-rules > :nth-child(1) > :nth-child(1) > :nth-child(3) p", 'Carrier: American Airlines');
  await waitForText(page, ".main-content > :nth-child(1) .rule-headline", 'Change');
  await waitForText(page, ".main-content > :nth-child(2) .rule-headline", 'Cancel');
  await page.click("[aria-label='Fare rules'] [aria-label='Close this dialog']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Select_flights_from_results__by_schedule_search__separated_tickets() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await Search_flight_in_results_page('AA');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
  await waitForText(page, ".pricing-options-container > :nth-child(1) .more-info div > :nth-child(1) > :nth-child(2)", 'Separated Tickets');
  await page.click(".pricing-options-container > :nth-child(1) .btn--primary");
}

async function Copy_of_List_length___latest_version(length, locator) {
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

async function Copy_of_List_length___latest_version_1(length, locator) {
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

async function Validate_separate_tickets_in_cart_and_checkout() {
  await waitForText(page, "[islastquote='false'] [class^='btn--width'], [class*=' btn--width']", 'Hold flight');
  await Copy_of_List_length___latest_version(2, '.has-text-weight-semibold.quote-title');
  await page.click("[islastquote='false'] .add-form-payment");
  await waitForText(page, ".add-card .section-title", 'Pay with other credit card');
  await page.click(".select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(1) [type='checkbox']");
  await page.click(".btn-save");
  await page.click(".add-form-payment");
  await waitForText(page, ".add-card .section-title", 'Pay with other credit card');
  await page.click(".select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(1) [type='checkbox']");
  await page.click(".btn-save");
  await page.click("[islastquote='false'] .el-checkbox__inner");
  await page.click(".last-quote .el-checkbox__inner");
  await page.click(".btn-container span");
  await waitForText(page, ".app-text-wrap-wrap", 'Don\'t share the contact details with airlines');
  await page.waitFor(2000);
  await waitForText(page, "#el-id-5057-565", '5025033');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__description", 'Your order has been processed successfully');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[islastquote='false'] .price-breakdown-btn", 'Price Breakdown');
  await Copy_of_List_length___latest_version_1(2, '.has-text-weight-semibold.quote-title');
  //TODO Please add an assertion here
await getText(page, "[islastquote='false'] .ticket-details span");
  //TODO Please add an assertion here
await getText(page, ".last-quote .ticket-details span");
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

