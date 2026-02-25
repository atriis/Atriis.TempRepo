/*
 * Test Name: 72504: OBT - Unused Tickets - Hide type MCO
 * Description: 
 * Status: Active
 * Labels: Sabre,unused tickets,Regression,Flights,2026 plan 2,Frosch
 * Owner: Noam Miller
 * Created: 2026-01-12T11:21:29Z
 * Updated: 2026-02-15T08:36:46Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('unusedTkt@corp.frosch');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await MCO_hidden__search_page();
  await Search_flights_one_way('AUS', 'ORD');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await MCO_hidden__results_page();
  await Add_to_trip_first_flight();
  await scrollTo(page, 0, 500);
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await MCO_hidden__booking_details_page();
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

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function Validate_MCO_hidden() {
  await waitForText(page, ".unused-tickets-container > :nth-child(4)", /^(?!.*MCO).*$/);
}

async function MCO_hidden__search_page() {
  await page.waitForSelector(".unused-tickets-btn", {state: "visible"});
  await page.click(".unused-tickets-btn");
  await page.waitForSelector(".unused-tickets-container", {state: "visible"});
  await Validate_MCO_hidden();
  await page.click("body > :nth-child(28) [xmlns='http://www.w3.org/2000/svg']");
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

async function MCO_hidden() {
  await waitForText(page, ".unused-tickets-container > :nth-child(4)", /^(?!.*MCO).*$/);
}

async function MCO_hidden_1() {
  await waitForText(page, ".unused-tickets-container > :nth-child(4)", /^(?!.*MCO).*$/);
}

async function MCO_hidden__results_page() {
  await page.click(".unused-tickets-icon");
  await page.waitForSelector(".unused-tickets-container", {state: "visible"});
  await MCO_hidden();
  await page.click("body > :nth-child(23) [fill='currentColor']");
  await page.click(".view-details-btn");
  await page.waitForSelector("#el-id-4031-363 > section > div", {state: "visible"});
  await MCO_hidden_1();
  await page.click("body > :nth-child(25) [xmlns='http://www.w3.org/2000/svg']");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_first_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
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

async function MCO_hidden_2() {
  await waitForText(page, ".el-radio-group > :nth-child(1)", /^(?!.*MCO).*$/);
}

async function MCO_hidden__booking_details_page() {
  await waitForText(page, "[id='el-collapse-content-828'] .el-checkbox__label", 'I\'d like to use my unused ticket for this flight');
  await page.click("[id='el-collapse-content-828'] .el-checkbox__inner");
  await MCO_hidden_2();
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
  await page.click(".trip-bar-content > :nth-child(2) .cart-btn .material-symbols-outlined");
  await waitForText(page, ".app-label--quote", 'On hold');
  await Trip_Cancelation();
}

