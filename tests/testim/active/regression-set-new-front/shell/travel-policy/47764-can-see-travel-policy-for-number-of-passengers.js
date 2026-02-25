/*
 * Test Name: 47764 can see travel policy for number of passengers
 * Description: 
 * Status: Active
 * Labels: multi pax,Flights,Regression,Travel policy,OOP,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-04-08T09:24:04Z
 * Updated: 2025-04-08T09:46:54Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Poly@Cinam.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await add_second_traveler_by_name('poly mispar');
  await add_third_traveller_by_name('amber ofpas');
  await Search_flights_round_trip('MAD', 'PAR');
  await Flight___Results___Wait_for__Add_to_trip__text();
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await Validate_pop_up_details();
  await page.click("body > :nth-child(22) .btn--primary");
  await Validate_pop_up_details_1();
  await page.click(".with-policy .btn--primary");
  await Validate_pop_up_details_2();
  await page.click("body > :nth-child(22) .btn--text");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
  await Validate_oop_and_tooltip_cart_page();
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

async function add_second_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("h2");
  if (false) {
    await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  }
  if (false) {
    // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  }
  await page.waitFor(2000);
}

async function add_third_traveller_by_name(name) {
  await page.waitFor(2000);
  await page.click(".add-btn .is-flex");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("#el-id-5736-287-item-0 > div");
  await page.waitForSelector(".travelers-list > section:nth-of-type(2) .traveler-name", {state: "visible"});
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

async function Validate_pop_up_details() {
  await waitForText(page, ".el-dialog__title", 'Flight Capacity Restriction');
  await waitForText(page, "body > :nth-child(22) p", 'You have reached the maximum number of passengers allowed on a single flight.');
  await waitForText(page, "body > :nth-child(22) .btn--text", 'Proceed anyway');
  await waitForText(page, "body > :nth-child(22) .btn--primary", 'Go back');
}

async function Validate_pop_up_details_1() {
  //TODO Please add an assertion here
await isVisible(page, ".out-of-policy-badge");
  await page.hover(".app-out-of-policy .info-icon");
  await waitForText(page, "#el-id-4097-243 > ul > li", 'Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only');
  await page.click(".flight-results");
}

async function Validate_pop_up_details_2() {
  await waitForText(page, ".el-dialog__title", 'Flight Capacity Restriction');
  await waitForText(page, "body > :nth-child(22) p", 'You have reached the maximum number of passengers allowed on a single flight.');
  await waitForText(page, "body > :nth-child(22) .btn--text", 'Proceed anyway');
  await waitForText(page, "body > :nth-child(22) .btn--primary", 'Go back');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Validate_oop_and_tooltip_cart_page() {
  //TODO Please add an assertion here
await isVisible(page, ".out-of-policy-badge");
  await page.hover(".is-justify-content-space-evenly .info-icon");
  await waitForText(page, "#el-id-4097-294 > ul > li", 'Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only');
}

