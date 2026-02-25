/*
 * Test Name: 35787 [Merge] LH NDC - All fare rules are selectable and can open the baggage on cart page
 * Description: 
 * Status: Active
 * Labels: No Amadeus Hotel Book,Fare Rules,Flights,merge,baggage,Lufthansa NDC Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-12-21T10:14:24Z
 * Updated: 2025-10-21T05:05:39Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('claraaguiar@ndclhclara.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_one_way___Business('MUC', 'JFK');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Search_flight_results_page('LH');
  await Flight___Click__Pricing_Options_();
  await All_fare_rules_are_selectable_and_adding_it_to_cart();
  await Pending_booking___wait_for_element_text();
  await Can_open_the_baggage_on_cart_page();
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

async function Search_flights_one_way___Business(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click(".inputs-wrapper .el-input__wrapper");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".class-input [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-id']");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Search_flight_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function All_fare_rules_are_selectable_and_adding_it_to_cart() {
  await waitForText(page, "[aria-describedby^='el-tooltip'] > :nth-child(2)", 'NDC direct rate');
  await page.click(".pricing-options-section > :nth-child(1) .fare-rules-btn");
  await waitForText(page, ".note > :nth-child(2)", /Fare rules/);
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.click(".pricing-options-section > :nth-child(2) .fare-rules-btn");
  await waitForText(page, ".note > :nth-child(2)", /Fare rules/);
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("[aria-label='Fare rules'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".pricing-options-section > :nth-child(2) .link-style");
  await waitForText(page, ".note > :nth-child(2)", /Fare rules/);
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.click(".pricing-options-section > :nth-child(1) .btn--primary");
  await waitForText(page, ".selected", 'Unselect');
  await page.click(".add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function Can_open_the_baggage_on_cart_page() {
  await scrollTo(page, 0, 454);
  await waitForText(page, ".flight-baggage .card-title", 'Baggage');
  await page.click(".flight-baggage .is-clickable");
  await waitForText(page, ".form-date-section > :nth-child(1) > :nth-child(1) .carrier-name", 'Lufthansa');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-id']");
  await page.click(".tabs-container .btn--primary");
  await Success_toast_alert();
  await scrollToElement(page, ".flight-baggage .card-title");
  await page.waitForSelector(".flight-baggage .filled", {state: "visible"});
}

