/*
 * Test Name: 47761 can see oop for number of passengers
 * Description: 
 * Status: Active
 * Labels: Travel policy,Regression,OOP,Flights,No Amadeus Hotel Book,Full Purchase,multi pax,progress page,Cancel by process,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-07-02T05:34:00Z
 * Updated: 2026-01-20T01:01:18Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('Poly@Cinam.com');
  await delete_previous_trips_if_exist();
  await first_trip();
  await second_trip();
  await cancel_first_trip();
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

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function cancel_if_not_cancelled_already() {
  if (await getText(page, ".base-quote-header .has-text-weight-bold") !== "new RegExp(/^(?!.*Cancelled).*/)") {
    return;
  }
  await Trip_Cancelation();
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function close_tab___choose_relevant_tab_in_context() {
  await close_tab();
}

async function cancel_on_second_tab() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await cancel_if_not_cancelled_already();
  await close_tab___choose_relevant_tab_in_context();
}

async function delete_if_exist() {
  if (!(await isVisible(page, ".trip-list > :nth-child(1) .ticket-details"))) {
    return;
  }
  await page.click(".trip-title");
  await page.waitFor(8000);
  await cancel_on_second_tab();
}

async function delete_previous_trips_if_exist() {
  if (true) {
    return;
  }
  await page.click(".top-container > :nth-child(5) .icon-container");
  await page.click("[role='group'] > :nth-child(2) .el-checkbox__inner");
  await page.click("[role='group'] > :nth-child(1) .el-checkbox__inner");
  await delete_if_exist();
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

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function validate_no_oop() {
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await scrollTo(page, 0, 600);
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Set_credit_card_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
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

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function book_and_finalize_with_contact_details() {
  await waitForText(page, "h1", 'Booking details');
  await waitForText(page, ".el-checkbox__label", /share the contact details/);
  await waitForText(page, ".email-input [type='text']", /@/);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function first_trip() {
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await add_second_traveler_by_name('amber ofpas');
  await Search_flights_round_trip('LHR', 'MUC');
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(1) .add-to-trip");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".text--bold", 'Pending booking');
  await validate_no_oop();
  await Set_credit_card_CVV_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize_with_contact_details();
  await waitForText(page, ".pnr-code", /PNR/);
  //TODO Please add an assertion here
await getText(page, ".not-last-segment .carrier-container div > :nth-child(2)");
  //TODO Please add an assertion here
await getText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .carrier-container div > :nth-child(2)");
  //TODO Please add an assertion here
await getText(page, ".trip-id");
  await close_tab___choose_relevant_tab_in_context();
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

async function pop_up_validation() {
  await waitForText(page, "body > :nth-child(13) .el-dialog__title", 'Flight Capacity Restriction');
  await waitForText(page, ".violation-msg-content div > :nth-child(1)", 'You have reached the maximum number of passengers allowed for the following flights:');
  await waitForText(page, "body > :nth-child(13) ul > :nth-child(1)", new RegExp(flightNumber1+" - 2 passengers booked on this flight"));
  await waitForText(page, "body > :nth-child(13) ul > :nth-child(2)", new RegExp(flightNumber2+" - 2 passengers booked on this flight"));
  await waitForText(page, ".violation-msg-content div > :nth-child(3)", 'Please search for alternative flight or proceed with justification');
  await waitForText(page, "body > :nth-child(13) .mr-2", 'Proceed anyway');
  await waitForText(page, "body > :nth-child(13) .btn--primary", 'Go back');
}

async function oop_validation() {
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".out-of-policy-badge", 'Out of policy');
  await page.hover("[aria-describedby='el-tooltip-7296']");
  await waitForText(page, "#el-tooltip-7296 > ul > li", 'Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only');
}

async function validate_tooltip() {
  await waitForText(page, ".app-tooltip__content .material-symbols-outlined", 'info');
  await page.hover(".app-tooltip__content .material-symbols-outlined");
  await waitForText(page, ".is-text-weight-bold", 'Flight Capacity Restriction');
  await waitForText(page, ".app-tooltip__description > :nth-child(1)", 'You have reached the maximum number of passengers allowed for the following flights:');
  await waitForText(page, ".app-tooltip .flight-list > :nth-child(1)", new RegExp(flightNumber1+" - 2 passengers booked on this flight"));
  await waitForText(page, ".app-tooltip .flight-list > li:nth-of-type(2) .flight-number-list", new RegExp(flightNumber2+" - 2 passengers booked on this flight"));
  await waitForText(page, ".app-tooltip__description > :nth-child(3)", 'Please search for alternative flight or proceed with justification');
  await waitForText(page, ".work-history", 'groups');
}

async function pop_up_validation_1() {
  await waitForText(page, "body > :nth-child(13) .el-dialog__title", 'Flight Capacity Restriction');
  await waitForText(page, ".violation-msg-content div > :nth-child(1)", 'You have reached the maximum number of passengers allowed for the following flights:');
  await waitForText(page, "body > :nth-child(13) ul > :nth-child(1)", new RegExp(flightNumber1+" - 2 passengers booked on this flight"));
  await waitForText(page, "body > :nth-child(13) ul > :nth-child(2)", new RegExp(flightNumber2+" - 2 passengers booked on this flight"));
  await waitForText(page, ".violation-msg-content div > :nth-child(3)", 'Please search for alternative flight or proceed with justification');
  await waitForText(page, "body > :nth-child(13) .mr-2", 'Proceed anyway');
  await waitForText(page, "body > :nth-child(13) .btn--primary", 'Go back');
}

async function validat_oop_in_cart() {
  await waitForText(page, ".out-of-policy-badge", 'Out of policy');
  await page.hover(".info-icon");
  await waitForText(page, "#el-id-9352-415 > ul > li", 'Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only');
  await scrollTo(page, 0, 600);
  await waitForText(page, ".oop-title", 'Out of policy');
  await waitForText(page, ".out-of-policy-label", 'Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only');
}

async function second_trip() {
  await book_a_new_trip();
  await add_traveler_by_name('poly mispar');
  await Search_flights_round_trip('LHR', 'MUC');
  await waitForText(page, ".filter-name", 'Price');
  await page.type("[placeholder='Search flight']", flightNumber1+','+flightNumber2);
  await page.waitFor(1000);
  await page.click(".flight-list > :nth-child(1) .add-to-trip");
  await pop_up_validation();
  await oop_validation();
  await validate_tooltip();
  await page.click(".with-policy .add-to-trip");
  await pop_up_validation_1();
  await page.click("body > :nth-child(18) .mr-2");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".text--bold", 'Pending booking');
  await validat_oop_in_cart();
  await Trip_Cancelation();
}

async function go_to_homepage() {
  await page.click("[title='Home Page'] .material-symbols-outlined");
}

async function Go_to_Trips() {
  await page.click(".top-container > :nth-child(5) .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
}

async function Go_to__My_trips_(tripNumber) {
  await Go_to_Trips();
  await page.type("[placeholder='Location, trip or travellers']", tripNumber);
}

async function refresh_tab() {
  await page.reload();
}

async function old() {
  if (true) {
    return;
  }
  await go_to_homepage();
  await page.waitFor(5000);
  await Go_to__My_trips_();
  await page.waitFor(1000);
  await refresh_tab();
  await page.click("[placeholder='Location, trip or travellers']");
  await page.type("[placeholder='Location, trip or travellers']", tripnumber);
  await page.click(".card-top");
}

async function cancel_first_trip() {
  if (true) {
    return;
  }
  await page.goto('https://ui.gtp-staging.com/trips/'+tripnumber+'/cart');
  await waitForText(page, ".payments-title", 'Trip overview');
  await waitForText(page, ".app-label--quote", 'Finalizing');
  await Trip_Cancelation();
  await old();
}

