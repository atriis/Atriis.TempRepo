/*
 * Test Name: 29424 Ypsilon> checkout with 3ds and Verify that the terms/fare rules are loading in results, cart and checkout
 * Description: 
 * Status: Active
 * Labels: Regression,No Amadeus Hotel Book,Ypsilon,Sanity,Pre Prod,Flights,Keeps failing,2026 plan 1
 * Owner: Noam Miller
 * Created: 2023-06-20T08:37:34Z
 * Updated: 2025-12-11T05:45:13Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ypsilonReg@corp.club');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_one_way('LON', 'MIL');
  await Validate_fare_rules_from_results_is_loading();
  await Validate_fare_rules_in_Pricing_Options();
  await add_flight_from_results_page_to_cart();
  await waitForText(page, ".text--bold", 'Pending booking');
  await Validate_fare_rules_in_cart();
  await set_CVV_in_cart_if_needed();
  await accept_and_proceed_to_checkout();
  await If_credit_card_verification___Ypsilon();
  await waitForText(page, ".app-label--quote", 'Ticketing Complete');
  await Validate_fare_rules_after_booking_completed();
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

async function Validate_fare_rules_from_results_is_loading() {
  await page.waitForSelector(".quick-sort", {state: "visible"});
  await page.click(".flight-list > :nth-child(1) .fare-rules-btn");
  await page.waitForSelector(".el-drawer__open [role='tablist']", {state: "visible"});
  await waitForText(page, ".rule-headline", 'Rules Link');
  await page.click("[aria-label='Fare rules'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Validate_fare_rules_in_Pricing_Options() {
  if (!(await isVisible(page, ".flight-list > :nth-child(1) .btn--default"))) {
    return;
  }
  await page.click(".flight-list > :nth-child(2) .pricing-options");
  await page.click(".pricing-options-section > :nth-child(1) .fare-rules-btn");
  await waitForText(page, ".rule-headline", 'Rules Link');
  await page.click("#el-drawer__title > button > i");
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
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

async function Validate_fare_rules_in_cart() {
  await page.click(".fare-rules-btn");
  //TODO Please add an assertion here
await isVisible(page, ".el-drawer__open [role='tablist']");
  await waitForText(page, ".rule-headline", 'Rules Link');
  await page.click("#pane-overview > div > section:nth-child(1) > section > div:nth-child(3) > div > header > button > i > svg > path");
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

async function accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Ypsilon_credit_card_verification() {
  await waitForText(page, ".el-dialog__title", 'Card verification');
  await page.type("#password", '555');
  await page.click("#submit_accept");
  await page.waitFor(5000);
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function If_credit_card_verification___Ypsilon() {
  await Ypsilon_credit_card_verification();
  await Click_Go_to_Trip();
}

async function Validate_fare_rules_after_booking_completed() {
  await page.click(".fare-rules-btn");
  await page.waitForSelector("[id='pane-overview'] [role='tablist']", {state: "visible"});
  await waitForText(page, ".rule-headline", 'Rules Link');
}

