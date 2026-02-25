/*
 * Test Name: 59765 Flights - Complete Search - Frosch TMC - Original currency is displayed across the system
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,currency,search,Complete trip,Cart,additional pricing options,price offer,results,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-03-24T12:25:25Z
 * Updated: 2025-08-20T01:19:21Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('tomblink182@froschtestimcorp.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('MIA', 'BOS');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Verifying_currency_in_results_page();
  await Verifying_currency_in_share_quote_results_page();
  await Verifying_currency_in_princing_options();
  await Verifying_currency_in_results_page_one_way_search();
  await Verifying_currency_in_share_quote_results_page_one_way_search();
  await Add_flight_from_results_page_to_cart();
  await Verifying_currency_in_cart();
  await Verifying_currency_in_share_quote_cart();
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

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Verifying_currency_in_results_page() {
  await waitForText(page, ".flight-list > :nth-child(1) .price-wrapper > :nth-child(1) > :nth-child(3) .amount", /$/);
}

async function Click_share_quote_button_in_flights_results_page() {
  await page.click(".actions .material-symbols-outlined");
}

async function Verifying_currency_in_share_quote_results_page() {
  await Click_share_quote_button_in_flights_results_page();
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /Share/);
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".has-text-primary", /Added/);
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
  await waitForText(page, "[bgcolor='#1C73FF'] tr > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(1)", /$/);
  await page.click(".app-footer .is-flex > :nth-child(1)");
  await waitForText(page, ".flight-list > :nth-child(1) .price-wrapper > :nth-child(1) > :nth-child(3) .amount", /$/);
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Verifying_currency_in_princing_options() {
  await Flight___Click__Pricing_Options_();
  await waitForText(page, ".flicking-camera > :nth-child(1) .price-wrapper > :nth-child(3) .amount", /$/);
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Verifying_currency_in_results_page_one_way_search() {
  await page.click(".breadcrumb ul > li:nth-of-type(1) a");
  await waitForText(page, "#pane-flight > h4", 'Find flights for your trip');
  await page.click("[id='el-id-3831-323'] > :nth-child(2) .el-radio__label");
  await page.click(".btn--primary");
  await waitForText(page, ".flight-list > :nth-child(1) .price-wrapper > :nth-child(1) > :nth-child(3) .amount", /$/);
}

async function Verifying_currency_in_share_quote_results_page_one_way_search() {
  await Flight___Click__Pricing_Options_();
  await waitForText(page, ".flicking-camera > :nth-child(1) .price-wrapper > :nth-child(3) .amount", /$/);
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
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

async function Verifying_currency_in_cart() {
  await waitForText(page, ".el-tabs [class^='mb'], [class*=' mb'] > :nth-child(3) .amount", /$/);
}

async function click_on_share_quote_from_the_cart() {
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-8844 > li:nth-child(1)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function Verifying_currency_in_share_quote_cart() {
  await click_on_share_quote_from_the_cart();
  await waitForText(page, "[bgcolor='#1C73FF'] tr > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(1)", /$/);
}

