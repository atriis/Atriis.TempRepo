/*
 * Test Name: 20078 [Merge] GroundScope - Pick up time is pre-populated with time when flight was added, edit GroundScope works as expected and search button displayed in the cart when adding GroundScope from cart
 * Description: 
 * Status: Active
 * Labels: Groundscope Regression,search,edit,merge,Flights,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-06-05T01:02:14Z
 * Updated: 2025-09-03T03:01:03Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("elisabete@groundscope.com");
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_one_way('LHR', 'MAD');
  await click_on_proceed_after_search___warning_and_continue();
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Search_Groundscope_from_cart__validating_that_the_time_is_prepopulated_when_there_is_already_a_flight_added_('lhr', 'emirates');
  await Groundscope_add_to_cart();
  await Search_Groundscope_from_cart__validating_that_the_time_is_prepopulated_when_there_is_already_a_flight_added__1('lgw', 'lhr');
  await Groundscope___Editing_groundscope_search_from_results_page();
  await Groundscope_add_to_cart();
  await GS_added_to_cart_is_correct();
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search___warning_and_continue() {
  await page.waitFor(1000);
  await proceed();
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

async function Search_Groundscope_from_cart__validating_that_the_time_is_prepopulated_when_there_is_already_a_flight_added_(pickup, dropoff) {
  await page.click(".flicking-camera > :nth-child(5) .icon-text");
  await page.waitForSelector("h3", {state: "visible"});
  await page.type("[name='false']", pickup);
  await page.click("[id^='el-popper-container'] .has-text-weight-bold");
  await page.type("#el-id-9871-1584", dropoff);
  await page.click("#el-id-9871-1484-item-0 > div");
  await page.click("#el-id-9871-1585");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-popper-container'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await waitForText(page, "#el-id-5109-2028", new RegExp('^(?:[01]?\\d|2[0-3]):([0-5]?\\d)$'));
  await page.click(".space-below > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.type("[id^='el-id']", 'executive');
  await page.click("#el-id-2577-1486 > span");
  await page.click(".space-below > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-id'] span");
  //TODO Please add an assertion here
await isVisible(page, ".search-btn");
  await page.click(".btn--size-large");
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Groundscope_add_to_cart() {
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
  await page.click(".ground-transport-list > :nth-child(1) .desktop-btn");
  await Pending_booking___wait_for_element_text();
}

async function Search_Groundscope_from_cart__validating_that_the_time_is_prepopulated_when_there_is_already_a_flight_added__1(pickup, dropoff) {
  await page.click(".flicking-camera > :nth-child(5) .icon-text");
  await page.waitForSelector("h3", {state: "visible"});
  await page.type("[name='false']", pickup);
  await page.click("[id^='el-popper-container'] .has-text-weight-bold");
  await page.type("#el-id-9871-1584", dropoff);
  await page.click("#el-id-9871-1484-item-0 > div");
  await page.click("#el-id-9871-1585");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-popper-container'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await waitForText(page, "#el-id-5109-2028", new RegExp('^(?:[01]?\\d|2[0-3]):([0-5]?\\d)$'));
  await page.click(".space-below > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-6278-2258", 'executive sedan');
  await page.click("[id*='id']");
  await page.click(".space-below > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-id'] span");
  //TODO Please add an assertion here
await isVisible(page, ".search-btn");
  await page.click(".btn--size-large");
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Groundscope___Editing_groundscope_search_from_results_page() {
  await page.click(".edit-search-btn");
  await page.type("#el-id-1937-3617", 'London Stansted Airport (STN), Bassingbourn Road, Stansted, United Kingdom');
  await page.click("#el-id-1937-3515-item-0 > div");
  await waitForText(page, "#el-id-5109-2028", new RegExp('^(?:[01]?\\d|2[0-3]):([0-5]?\\d)$'));
  await page.click(".search-btn");
  await waitForText(page, ".results-amount", /Showing/);
  await waitForText(page, ".location-wrpper > :nth-child(3)", /STN/);
}

async function GS_added_to_cart_is_correct() {
  await scrollToElement(page, ".last-quote .has-text-weight-semibold");
  await waitForText(page, ".last-quote .has-text-weight-semibold", /STN/);
  await waitForText(page, ".last-quote .links-container > :nth-child(2) [target='_blank']", /STN/);
}

