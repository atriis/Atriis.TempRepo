/*
 * Test Name: 66133 Iberia NDC - Flight - Complete Trip booking and verifying Fare Rules
 * Description: 
 * Status: Active
 * Labels: Flights,Fare Rules,Regression,Pre Prod,NDC,Full Purchase,Iberia,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-08-29T04:55:34Z
 * Updated: 2025-08-29T05:42:18Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("bsiberia@bsiberia.com");
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('LON', 'MAD');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Check_flight_fare_rules___results_page();
  await Check_flight_fare_rules___pricing_options();
  await Check_flight_fare_fare___flight_details__results_page_();
  await Add_flight_from_results_page_to_cart();
  await Pending_Booking___Wait_for_element_text();
  await Check_flight_fare_rules___results_page();
  await Check_flight_fare_rules___flight_details__cart_();
  await Check_flight_fare_rules___price_breakdown__cart_();
  await Check_flight_terms_and_conditions__fare_rules____cart();
  await Accept__Terms___Conditions_();
  await Hold_flight();
  await Check_flight_fare_rules___results_page();
  await Check_flight_fare_rules___flight_details__cart_();
  await Check_flight_fare_rules___price_breakdown__cart_();
  await Check_flight_terms_and_conditions__fare_rules____cart();
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

async function Check_flight_fare_rules___results_page() {
  await waitForText(page, ".fare-rules-btn", 'Fare rules');
  await page.click(".fare-rules-btn");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Check_flight_fare_rules___pricing_options() {
  await Flight___Click__Pricing_Options_();
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.waitFor(1000);
  await scrollToElement(page, ".flicking-camera > :nth-child(1) .link-style");
  await page.waitFor(1000);
  await page.click(".pricing-options-section > section:nth-of-type(1) .link-style");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Check_flight_fare_fare___flight_details__results_page_() {
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click(".app-footer .btn--text");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[aria-label='Flight details'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
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

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Check_flight_fare_rules___flight_details__cart_() {
  await waitForText(page, ".more-details-btn", 'Flight details');
  await page.click(".more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click(".app-footer .btn--text");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Check_flight_fare_rules___price_breakdown__cart_() {
  await waitForText(page, ".price-breakdown-btn", 'Price Breakdown');
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".price-breakdown-segment > :nth-child(1)", /Validation carrier/);
  await page.click(".app-footer .btn--text");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await waitForText(page, ".price-breakdown-segment > :nth-child(1)", /Validation carrier/);
  await page.click("[aria-label='Price Breakdown'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".price-breakdown-btn", 'Price Breakdown');
}

async function Check_flight_terms_and_conditions__fare_rules____cart() {
  await scrollToElement(page, ".page-view a");
  await page.click(".page-view a");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await waitForText(page, ".price-breakdown-btn", 'Price Breakdown');
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Price_Change() {
  if (await getText(page, ".muliBold") !== "'Price change'") {
    return;
  }
  await page.click(".app-footer .is-flex-wrap-wrap .btn--primary");
}

async function On() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Hold_flight() {
  await page.click(".quote-card .btn--default");
  await Price_Change();
  await On();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

