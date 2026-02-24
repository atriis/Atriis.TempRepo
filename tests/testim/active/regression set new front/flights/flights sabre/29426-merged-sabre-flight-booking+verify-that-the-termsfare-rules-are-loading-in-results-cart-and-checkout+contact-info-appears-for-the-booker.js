/*
 * Test Name: 29426 MERGED Sabre flight booking + Verify that the terms/fare rules are loading in results, cart and checkout + contact info appears for the booker
 * Description: 
 * Status: Active
 * Labels: Flights,Sabre,Fare Rules,No Amadeus Hotel Book,Regression,contact info,Sanity,Pre Prod,Full Purchase,progress page,Cancel by process,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-20T01:26:42Z
 * Updated: 2026-02-04T10:12:19Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('sabre@testim.com');
  await Book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_one_way("JFK", "DFW");
  await Check_Fare_Rules();
  await add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Check_flight_fare_rules___cart();
  await accept_and_proceed_to_checkout();
  await waitForText(page, "h1", 'Booking details');
  await waitForText(page, "[class^='is-size'], [class*=' is-size']", 'Contact details');
  await validate_traveler__booker__phone_and_email();
  await Book_and_finalize_with_contact_details();
  await Check_flight_fare_rules___cart();
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

async function Check_Fare_Rules() {
  await waitForText(page, ".fare-rules-btn", 'Fare rules');
  await page.click(".fare-rules-btn");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
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

async function Check_flight_fare_rules___cart() {
  await waitForText(page, ".fare-rules-btn", 'Fare rules');
  await page.click(".fare-rules-btn");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
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

async function validate_traveler__booker__phone_and_email() {
  await waitForText(page, ".page-layout-main .el-card__body > :nth-child(1) .label", 'Traveler Phone');
  await waitForText(page, ".page-layout-main .el-card__body > :nth-child(1) .is-flex > div:nth-of-type(1) [type='text']", '972');
  await waitForText(page, ".page-layout-main .el-card__body > :nth-child(1) .is-flex > div:nth-of-type(2) [type='text']", '54');
  await waitForText(page, ".page-layout-main .el-card__body > :nth-child(1) .is-flex > div:nth-of-type(3) [type='text']", '7256398');
  await waitForText(page, ".page-layout-main .el-card__body > :nth-child(2) .label", 'Traveler Email');
  await waitForText(page, ".email-input [type='text']", 'sabre@testim.com');
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Book_and_finalize_with_contact_details() {
  await waitForText(page, "h1", 'Booking details');
  await waitForText(page, ".el-checkbox__label", /share the contact details/);
  await waitForText(page, ".email-input [type='text']", /@/);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

