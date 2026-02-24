/*
 * Test Name: 64409 In Progress Page > inProgress > "Confirmation in progress" - Confirmed > "Success"
 * Description: 
 * Status: Active
 * Labels: Flights,Cars,SunnyCars Regression,Regression,Transportation,Benerail Moove Regression,Cancel by process,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-07-11T04:41:20Z
 * Updated: 2026-01-19T07:46:47Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@onrequest.gal');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_rental_agency();
  await Search_earlier_date_car_by_place('LHR');
  await Results____Add_to_trip__on_Request();
  await Pending_Booking___Wait_for_element_text();
  await select_payment_method();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Travellers_Ref_Questions();
  await Book_and_finalize___Progress_Page();
  await In_Progress_Page();
  await close_tab___choose_relevant_tab_in_context();
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('MAD', 'LHR');
  await Avoid__Instant_Purchases_();
  await Add_to_trip_first_flight();
  await select_payment_method();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Travellers_Ref_Questions_1();
  await Book_and_finalize___Progress_Page();
  await In_Progres_Page();
  await Click_Go_to_Trip();
  await Trip_Overview();
  await Trip_Cancellation___Pass_on_Warning();
  await close_tab___choose_relevant_tab_in_context();
  await Logout();
  await Login('testim@benemoove.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Benerail_one_way('NLABK', 'BEBMI');
  await Add_Benerail_one_way_from_search_results_to_cart();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Book_and_finalize___Progress_Page();
  await In_Progress_Page();
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

async function Select_rental_agency() {
  await page.click("#tab-car > div");
  await page.click(".is-one-quarter-desktop [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-554-956", 'EP');
  await page.click("#el-id-554-854 > span");
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
}

async function old() {
  if (true) {
    return;
  }
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  if (false) {
    await page.click("[placeholder='Pick-up Date']");
  }
  if (false) {
    await page.click("[aria-label='Next Month']");
  }
  if (false) {
    await page.click(".el-date-table tbody > :nth-child(6) > td:nth-of-type(2) span");
  }
  await page.click("#el-id-9250-87");
  await page.click("[id='el-id-3812-54'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-993-38 > span");
  await page.waitFor(1000);
  await page.click("[id='el-id-9786-26'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  if (false) {
    await page.click("#el-id-8716-55 > span");
  }
  await page.click("#el-id-7049-91 > span");
  await page.click("[id='el-id-2044-100'] .btn-apply");
  if (false) {
    await page.click("[placeholder='Drop-off Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(6) > td:nth-of-type(3) span");
  }
  await page.click("#el-id-9250-122");
  await page.waitFor(1000);
  await page.click("[id='el-id-9250-123'] [class^='mr'], [class*=' mr'] .el-select__wrapper");
  await page.click("#el-id-9198-139 > span");
  await page.click("[id='el-id-9198-123'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-8989-90 > span");
  await page.click("[id='el-id-9151-135'] .btn-apply");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
  await page.click(".search-btn");
}

async function Search_earlier_date_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-9087-96'] .today .el-date-table-cell__text");
  const boolean_9 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_9) {
    await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  }
  const boolean_10 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_10) {
    await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  }
  const boolean_11 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_11) {
    await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  }
  await page.click("#el-id-9045-278");
  const boolean_12 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_12) {
    await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  }
  const boolean_13 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_13) {
    await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  }
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click(".search-btn");
  await old2();
  await old();
}

async function Click_on_proceed_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Results____Add_to_trip__on_Request() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
  await page.click(".el-switch__action");
  await waitForText(page, ".car-list > :nth-child(1) .car-features > :nth-child(1) p", 'On request');
  await page.click(".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await Click_on_proceed_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
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

async function Travellers_Ref_Questions() {
  await page.click("#el-id-8853-1146");
  await page.type("#el-id-8853-1146", '5');
}

async function Book_and_finalize___Progress_Page() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
}

async function In_Progress_Page() {
  await waitForText(page, ".success-message__title", 'Confirmation in Progress');
  await waitForText(page, ".quote-results__status", 'In Progress');
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

async function old_1() {
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
  await old_1();
  await page.click(".search-btn");
}

async function Avoid__Instant_Purchases_() {
  await page.click(".is-focus .is-flex");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Add_to_trip_first_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await Click_on_proceed_if_there_is_a_conflict_with_previous_trip();
  await Pending_Booking___Wait_for_element_text();
}

async function Travellers_Ref_Questions_1() {
  await page.click("#el-id-8853-1146");
  await page.type("#el-id-8853-1146", '5');
}

async function In_Progres_Page() {
  await waitForText(page, ".success-message__title", /^Success|Confirmation in Progress/);
  await waitForText(page, ".quote-results__status", /^Ticketing Complete|Confirmed|Finalizing/);
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Trip_Overview() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Trip_Cancellation___Pass_on_Warning() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function Logout() {
  await page.click(".logout-icon");
}

async function old2_1() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
}

async function Search_Benerail_one_way(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click(".from-row [placeholder='Date']");
  await page.click("#el-id-3123-140");
  await page.click("[aria-label='Next Month']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await old2_1();
  await page.click(".search-btn");
}

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

async function Add_Benerail_one_way_from_search_results_to_cart() {
  await Benerail___Results___Wait_for__Select__text();
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await Pending_Booking___Wait_for_element_text();
}

