/*
 * Test Name: 29774 MERGED mandatory and optional notifications for flight by destination and carrier + Financial reference codes are taken from the user group of the primary traveler - 2 users, second is the primary
 * Description: mandatory and optional notifications appear in case searching for flight to zimbabwe, and in case adding emirates flight to zimbabwe to the cart
 * Status: Active
 * Labels: push notifications,Flights,No Amadeus Hotel Book,Pre Prod,Sanity,Financial Reference Code,NL government,Regression,Search Flight,Daily Shell,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-01-30T11:31:33Z
 * Updated: 2026-02-11T02:16:21Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('pini');
  await add_second_traveler_by_name___primary('olga');
  await Search_flights_round_trip('tlv', 'zimbabwe');
  await NL___fill_ref_field_education_and_courses();
  await Mandatory_notification();
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Search_flight_in_results_page('Emirates');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, "[role='alert'] p", 'optional notification for emirates flight to Zimbabwe');
  await waitForText(page, ".mt5", 'mandatory notification for emirates flight to Zimbabwe');
  await page.click("body > :nth-child(11) .el-checkbox__inner");
  await page.click("body > :nth-child(11) .btn");
  await page.waitFor(2000);
  await refresh_tab();
  if (false) {
    await page.waitFor(2000);
  }
  await page.click(".btn-- .material-symbols-outlined");
  await waitForText(page, ".notification-container > div:nth-of-type(2) .notification-text > :nth-child(1)", 'optional notification for flight to Zimbabw ...');
  await waitForText(page, ".notification-container > div:nth-of-type(3) .notification-text > :nth-child(1)", 'optional notification for emirates flight t ...');
  await waitForText(page, ".notification-container > div:nth-of-type(5) .notification-message span", 'optional notification for flight to Zimbabw ...');
  await waitForText(page, ".notification-container > div:nth-of-type(6) .notification-message span", 'mandatory notification for flight to Zimbab ...');
  await waitForText(page, ".notification-container > div:nth-of-type(7) .notification-message span", 'optional notification for emirates flight t ...');
  await waitForText(page, ".notification-container > div:nth-of-type(8) .notification-message span", 'mandatory notification for emirates flight  ...');
  await page.click(".close");
  await go_to_checkout();
  await validate_financial_reference();
  await delete_one_and_only_qoute_from_cart_before_checkout();
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

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function refresh_tab() {
  await page.reload();
}

async function refresh_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await refresh_tab();
}

async function add_second_traveler_by_name___primary(name) {
  await page.waitFor(500);
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("body > :nth-child(16) .el-checkbox__inner");
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
  await refresh_if_there_is_no_star();
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

async function NL___fill_ref_field_education_and_courses() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("body > :nth-child(13) .btn--primary");
}

async function Close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Mandatory_notification() {
  await waitForText(page, "[role='alert'] p", 'optional notification for flight to Zimbabwe');
  await waitForText(page, ".mt5", 'mandatory notification for flight to Zimbabwe');
  await Close_mandatory_notification();
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Search_flight_in_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
}

async function go_to_checkout() {
  await page.click(".el-checkbox__inner");
  await set_CVV_in_cart_if_needed();
  if (await isVisible(page, "[autocomplete='off']")) {
    await page.type("[autocomplete='off']", 'abc');
  }
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function validate_financial_reference() {
  await page.click(".el-select__caret");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(1) span", 'uploadname7 (uploadcode7)');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(2) span", 'uploadname5 (uploadcode5)');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(3) span", 'uploadname6 (uploadcode6)');
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function delete_one_and_only_qoute_from_cart_before_checkout() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await page.click("[aria-label='Cancel item - '] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  if (false) {
    await page.click("body > :nth-child(12) .btn--primary");
  }
  if (false) {
    await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  }
  await page.click(".close-btn");
}

