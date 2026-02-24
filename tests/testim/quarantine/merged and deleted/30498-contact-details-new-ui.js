/*
 * Test Name: 30498 contact details new UI
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Unassigned
 * Created: 2023-07-21T10:45:30Z
 * Updated: 2025-05-19T02:16:41Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("ruimendes@amadeus.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip("LIS", "BCN");
  await page.waitForSelector(".actions", {state: "visible"});
  await flight___click_no_stops();
  await scrollToElement(page, ".sort-by-label");
  await Flight_results___sort_by_price();
  await page.click("[aria-describedby='el-tooltip-2387']");
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".text--bold", 'Pending Booking');
  await Checkout_add_payment_method("rui mendes", "portugal", "lisbon", "1170", "avenue road", "170");
  await Accept_and_proceed_to_checkout();
  await page.waitForSelector(".contact-details-container [class^='is-size'], [class*=' is-size']", {state: "visible"});
  await Validate_travel_email_and_phone();
  await Click_cart();
  await Trip_Cancelation();
  await New_trip_after_cancel_trip();
  await add_traveler_by_name("olga");
  await Search_flights_round_trip("LIS", "BCN");
  await page.waitForSelector(".actions", {state: "visible"});
  await flight___click_no_stops_1();
  await page.click(".el-table__body-wrapper .lowest-fare .cell-price");
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".text--bold", 'Pending Booking');
  await select_payment_method();
  await Accept_and_proceed_to_checkout();
  await page.waitForSelector(".contact-details-container [class^='is-size'], [class*=' is-size']", {state: "visible"});
  await Validate_travel_email_and_phone_1();
  await Click_cart();
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

async function flight___click_no_stops() {
  await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
}

async function Flight_results___sort_by_price() {
  await page.click(".sort-by-label");
  await page.click(".el-dropdown-menu > :nth-child(2)");
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

async function Credit_Guard_modal_insert_cc_number(ccNumber) {
  await page.click("[placeholder='Please enter your credit card number']");
  await page.type("[placeholder='Please enter your credit card number']", ccNumber);
  await page.waitFor(500);
  await page.click("body > :nth-child(14) .btn--primary");
}

async function Checkout_add_payment_method(cardholdername, country, city, zipcode, streetname, cvv) {
  await page.click(".add-form-payment");
  await waitForText(page, ".add-card .section-title", 'Pay with other credit card');
  await page.click(".add-credit");
  await page.click("[placeholder='Select card type']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(4) [class^='px'], [class*=' px']");
  await page.click("[placeholder='Card holder name']");
  await page.type("[placeholder='Card holder name']", cardholdername);
  await page.click(".form-inputs > :nth-child(5) > :nth-child(1) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .selected");
  await page.click("[placeholder='Year']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(6)");
  await page.click("[placeholder='Choose country']");
  await page.type("[placeholder='Choose country']", country);
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(180)");
  await page.click("[placeholder='City name']");
  await page.type("[placeholder='City name']", city);
  await page.click("[placeholder='Zip code']");
  await page.type("[placeholder='Zip code']", zipcode);
  await page.click("[placeholder='Street name']");
  await page.type("[placeholder='Street name']", streetname);
  await page.click(".insertCard");
  await Credit_Guard_modal_insert_cc_number("4899747954942944");
  await page.click(".btn-save");
  await page.click(".close");
  await page.click("[type='number']");
  await page.type("[type='number']", cvv);
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

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Validate_travel_email_and_phone() {
  await waitForText(page, ".email-input [type='text']", 'carolina.santos@atriis.com');
  await waitForText(page, "#el-collapse-content-242 > div > div > div > div:nth-child(1) > div > div > div:nth-child(2) > input", '686');
  await waitForText(page, "#el-collapse-content-242 > div > div > div > div:nth-child(1) > div > div > div:nth-child(4) > input", '234');
  await waitForText(page, "#el-collapse-content-242 > div > div > div > div:nth-child(1) > div > div > div:nth-child(6) > input", '34555');
}

async function Click_cart() {
  await page.click(".cart-btn .material-symbols-outlined");
  await page.waitForSelector(".page-layout-main .icon-img", {state: "visible"});
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function New_trip_after_cancel_trip() {
  await page.click(".btn-container > :nth-child(1)");
  await page.waitForSelector("[role='tablist']", {state: "visible"});
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

async function flight___click_no_stops_1() {
  await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
}

async function select_payment_method() {
  if (await isVisible(page, "[idx='0'] .fop-box")) {
    return;
  }
  await page.click(".add-form-payment");
  await page.waitForSelector(".select-credit-card > :nth-child(3) .section-title", {state: "visible"});
  await page.click(".checkbox-round");
  await page.click(".card-icon");
  await page.click(".btn-save");
  await page.waitForSelector(".fop-box", {state: "visible"});
}

async function Validate_travel_email_and_phone_1() {
  await waitForText(page, ".email-input [type='text']", 'olga.marchenko@atriis.com');
  await waitForText(page, ".contact-details-container .el-card__body > :nth-child(2) .is-flex > div:nth-of-type(1) [type='text']", '22');
  await waitForText(page, ".contact-details-container .el-card__body > :nth-child(2) .is-flex > div:nth-of-type(2) [type='text']", '333');
  await waitForText(page, ".contact-details-container .el-card__body > :nth-child(2) .is-flex > div:nth-of-type(3) [type='text']", '4444');
}

