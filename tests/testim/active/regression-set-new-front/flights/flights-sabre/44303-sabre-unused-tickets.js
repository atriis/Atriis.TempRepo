/*
 * Test Name: 44303 Sabre unused tickets
 * Description: 
 * Status: Active
 * Labels: Regression,unused tickets,Sabre,Flights,Full Purchase,TLC,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-03-28T10:49:59Z
 * Updated: 2026-02-17T09:00:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('Olusola.Abidoye@atriis.com');
  await book_a_new_trip();
  await add_traveler_by_name('chris tree');
  await waitForText(page, ".unused-tickets-btn", 'airplane_ticket');
  await page.click(".unused-tickets-btn");
  await waitForText(page, "body > :nth-child(12) .el-dialog__title", 'Unused Tickets');
  await validate_unused_tickets_pop_up();
  await waitForText(page, ".advanced-search-container .el-checkbox__label", 'Allow nearby airports');
  await page.click(".advanced-search-container .el-checkbox__inner");
  await Search_flights_round_trip('LHR', 'ATH');
  await answer_ref_fields_chris_tree_and_proceed();
  await validate_icon_in_header();
  await validate_filter();
  await page.type("[placeholder='Search flight']", 'Aegean Airlines');
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".text--bold", 'Pending booking');
  await waitForText(page, ".unused-tickets-btn", 'airplane_ticket');
  await waitForText(page, ".unused-tickets-icon", 'airplane_ticket');
  await choose_fop_in_cart_if_needed();
  await scrollTo(page, 0, 800);
  await add_justification_if_needed();
  await Accept_and_proceed_to_checkout();
  await Price_change_prompt();
  await validate_unused_tickets_on_checkout();
  await page.click("[id='app'] > :nth-child(2) .cart-btn .material-symbols-outlined");
  await waitForText(page, ".app-label--quote", 'On hold');
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

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function validate_unused_tickets_pop_up() {
  await waitForText(page, "body > :nth-child(12) p", 'List of unused tickets related to the traveler.  After adding a flight you will be able to utilise the unused ticket for price deduction');
  await waitForText(page, ".muliBold", 'TREE/CHRIS MAS');
  await waitForText(page, ".unused-tickets-container > :nth-child(3) > :nth-child(1)", 'Carrier');
  await waitForText(page, ".unused-tickets-container > :nth-child(3) > :nth-child(2)", 'PNR');
  await waitForText(page, ".unused-tickets-container > :nth-child(3) > :nth-child(3)", 'Cost');
  await waitForText(page, ".unused-tickets-container > :nth-child(3) > :nth-child(4)", 'Expiry date');
  await waitForText(page, ".unused-tickets-container > :nth-child(4) .is-clickable", 'Fare Rules');
  await page.click("body > :nth-child(12) .el-dialog__close");
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function answer_ref_fields_chris_tree_and_proceed() {
  await page.click("[name='TRIP PURPOSE']");
  await page.click("#el-id-4843-941 > span");
  await page.click("[id^='el-collapse-content'] .traveler-questions > :nth-child(1) [fill='currentColor']");
  await page.click("[id*='id'] span");
  await Click_on_proceed_after_search();
}

async function validate_icon_in_header() {
  await waitForText(page, ".filter-name", 'Price');
  await waitForText(page, ".unused-tickets-icon", 'airplane_ticket');
}

async function validate_text_unused_ticket_available_on_all_results() {
  await waitForText(page, "[aria-describedby='el-tooltip-3974'] > :nth-child(2)", 'Unused ticket available');
}

async function validate_filter() {
  await waitForText(page, "[title='Unused Tickets Available']", 'Unused Tickets Available');
  await page.click(".app-filter__content > :nth-child(4) .el-checkbox__inner");
  await scrollTo(page, 0, 500);
  await validate_text_unused_ticket_available_on_all_results();
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

async function choose_for_if_needed() {
  if (await getText(page, ".add-form-payment") !== "/Add payment method/") {
    return;
  }
  await page.click(".add-form-payment");
  await page.click(".select-credit-card > :nth-child(3) > :nth-child(2) > :nth-child(1) [type='checkbox']");
  await page.click(".btn-save");
  await waitForText(page, ".fop-owner", /Paid by/);
}

async function choose_fop_in_cart_if_needed() {
  await choose_for_if_needed();
}

async function add_justification_if_needed() {
  if (await getText(page, ".oop-title") !== "'Out of policy'") {
    return;
  }
  await page.type("[autocomplete='off']", 'aaa');
  await page.click("[class^='px'], [class*=' px'] .btn");
  await page.waitFor(500);
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

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function validate_unused_tickets_on_checkout() {
  await waitForText(page, ".trip-checkout-stepper > :nth-child(1) .page-title", 'Review & Select');
  await waitForText(page, "#el-collapse-head-1198 > div > div > div:nth-child(2) > span", 'Unused Tickets');
  await waitForText(page, "#el-collapse-content-1313 > div > div > div > div > section > span", /London - Athens/);
  await waitForText(page, "[id='el-collapse-content-1198'] .el-checkbox__label", 'I\'d like to use my unused ticket for this flight');
  await page.click("[id='el-collapse-content-1198'] .el-checkbox__inner");
  await waitForText(page, ".el-radio__label > :nth-child(2)", 'TREE/CHRIS MAS • Ticket • 0068087037164 • USD 2454.9 • Sat, 24 Jun, 2034 • IPUAPG');
  await waitForText(page, ".disabled", 'Calculate');
  await page.click(".el-radio__inner");
  await page.click(".page-layout-main .btn");
  await waitForText(page, "[class^='is-size'], [class*=' is-size']", 'Recalculation could not be processed. Please contact your agency');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

