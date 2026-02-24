/*
 * Test Name: 35620 Sabre branded info in results, pricing and cart
 * Description: 
 * Status: Active
 * Labels: No Amadeus Hotel Book,Branded fares,Flights,Regression,Sabre,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-08-31T09:51:03Z
 * Updated: 2025-04-20T10:10:52Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunaovidio@bovidio.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('MIA', 'BOS');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Check_flight_branded_fares___flight_details__results_page_();
  await Check_flight_branded_fares___pricing_options__results_page_();
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Check_flight_branded_fares___flight_details__cart_();
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

async function Flight___Click__Flight_details_() {
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
}

async function Check_flight_branded_fares___flight_details__results_page_() {
  await Flight___Click__Flight_details_();
  await page.click(".flight-details > :nth-child(1) > :nth-child(2) .btn");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[aria-label='Flight details'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
}

async function Check_flight_branded_fares___pricing_options__results_page_() {
  await page.click(".flight-list > :nth-child(1) .pricing-options");
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.click(".segment-preview .btn");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click(".segment-preview .btn");
  await waitForText(page, ".segment-preview .btn", 'Flight details');
  await page.click(".pricing-options-section > :nth-child(1) .brand-name");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitFor(2500);
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Check_flight_branded_fares___flight_details__cart_() {
  await waitForText(page, ".more-details-btn", 'Flight details');
  await page.click(".more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.click("#el-drawer__title > button > i");
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

