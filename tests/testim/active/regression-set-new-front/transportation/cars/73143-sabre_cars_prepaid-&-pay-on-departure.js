/*
 * Test Name: 73143 Sabre - Cars - PrePaid & Pay on Departure
 * Description: 
 * Status: Active
 * Labels: Cars,Full Purchase,Daily Transportation,Transportation,Regression,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2026-01-30T05:56:47Z
 * Updated: 2026-02-13T03:40:49Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@testim.test');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search();
  await Ref_Fields();
  await waitForText(page, ".car-list > :nth-child(1) .payment-method p", 'Pay On Departure');
  await add_car_from_results_page_to_cart();
  await waitForText(page, ".payment-method p", 'Pay On Departure');
  await Fill_free_text_justification_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await Traveller_Ref_Question();
  await Book_and_finalize();
  await waitForText(page, ".is-justify-content-space-evenly p", 'Pay On Departure');
  await Trip_Cancelation();
  await page.click(".btn-container > :nth-child(1)");
  await Add_traveler___I_am_the_traveler();
  await Search_1();
  await Ref_Fields_1();
  await waitForText(page, ".car-list > :nth-child(1) .payment-method p", 'Pre paid');
  await add_car_from_results_page_to_cart();
  await waitForText(page, ".payment-method p", 'Pre paid');
  await Fill_free_text_justification_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await Traveller_Ref_Question_1();
  await Book_and_finalize();
  await waitForText(page, ".is-justify-content-space-evenly p", 'Pre paid');
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

async function Search_car_by_place_and_Hertz_rental_agency(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click("#el-id-528-291");
  await page.type("#el-id-528-291", 'ZE');
  await page.click("#el-id-528-211 > span");
  await page.click(".btn");
  await old2();
}

async function Current_month() {
  await page.evaluate(() => {
    // Get current month (3-letter abbreviation)
    const now = new Date();
    const monthAbbrev = now.toLocaleString('en-US', { month: 'short' });
    
    // Save it to Testim variable for next steps
    exportsTest.monthAbbrev = monthAbbrev;
  });
}

async function old2_1() {
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

async function Copy_of_Search_earlier_date_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await Current_month();
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-2232-2345'] .el-date-picker__header > :nth-child(3)");
  await page.click("[aria-label='September'] .cell");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-9087-96'] .today .el-date-table-cell__text");
  const boolean_114 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_114) {
    await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  }
  const boolean_115 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_115) {
    await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  }
  const boolean_116 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_116) {
    await page.click(".el-zoom-in-top-leave-from tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  }
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-2232-2345'] .el-date-picker__header > :nth-child(3)");
  await page.click("[aria-label='September'] .cell");
  const boolean_117 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_117) {
    await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  }
  const boolean_118 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_118) {
    await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
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
  await old2_1();
  await old();
}

async function No_results_found___try_another_dates() {
  if (!(await isVisible(page, ".warning-icon"))) {
    return;
  }
  await waitForText(page, "h3", 'No results found');
  await page.click(".blue");
  await Copy_of_Search_earlier_date_car_by_place(place);
}

async function Step_under_test__another_dates_() {
  await page.waitFor(3000);
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await No_results_found___try_another_dates();
}

async function Search() {
  await Search_car_by_place_and_Hertz_rental_agency('LHR');
  await Step_under_test__another_dates_();
}

async function Ref_Fields() {
  await page.click("#el-id-5534-301");
  await page.click("#el-id-4146-284 > span");
  await page.click("body > :nth-child(17) .btn--primary");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Fill_free_text_justification_in_cart_if_needed() {
  await scrollTo(page, 0, 493);
  if (await getText(page, ".oop-title") === "'Out of policy'") {
    await page.type("[autocomplete='off']", 'abc');
  }
  await page.waitFor(1000);
  if (await getText(page, ".help") === "'Please save your justification'") {
    await page.click("[id='pane-overview'] .btn");
  }
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

async function Traveller_Ref_Question() {
  await page.click("#el-id-2926-574");
  await page.type("#el-id-2926-574", '1');
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function old2_2() {
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

async function Search_car_by_place_and_Europcar_rental_agency(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click("#el-id-528-291");
  await page.type("#el-id-528-291", 'ET');
  await page.click("#el-id-528-211 > span");
  await page.click(".btn");
  await old2_2();
}

async function Current_month_1() {
  await page.evaluate(() => {
    // Get current month (3-letter abbreviation)
    const now = new Date();
    const monthAbbrev = now.toLocaleString('en-US', { month: 'short' });
    
    // Save it to Testim variable for next steps
    exportsTest.monthAbbrev = monthAbbrev;
  });
}

async function old2_3() {
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

async function old_1() {
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

async function Copy_of_Search_earlier_date_car_by_place_1(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await Current_month_1();
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-2232-2345'] .el-date-picker__header > :nth-child(3)");
  await page.click("[aria-label='September'] .cell");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-9087-96'] .today .el-date-table-cell__text");
  const boolean_119 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_119) {
    await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  }
  const boolean_120 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_120) {
    await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  }
  const boolean_121 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_121) {
    await page.click(".el-zoom-in-top-leave-from tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  }
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-2232-2345'] .el-date-picker__header > :nth-child(3)");
  await page.click("[aria-label='September'] .cell");
  const boolean_122 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_122) {
    await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  }
  const boolean_123 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_123) {
    await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
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
  await old2_3();
  await old_1();
}

async function No_results_found___try_another_dates_1() {
  if (!(await isVisible(page, ".warning-icon"))) {
    return;
  }
  await waitForText(page, "h3", 'No results found');
  await page.click(".blue");
  await Copy_of_Search_earlier_date_car_by_place_1(place);
}

async function Step_under_test__another_dates__1() {
  await page.waitFor(3000);
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await No_results_found___try_another_dates_1();
}

async function Search_1() {
  await Search_car_by_place_and_Europcar_rental_agency('LHR');
  await Step_under_test__another_dates__1();
}

async function Ref_Fields_1() {
  await page.click("#el-id-5534-301");
  await page.click("#el-id-5534-295");
  await page.click("body > :nth-child(17) .btn--primary");
}

async function Traveller_Ref_Question_1() {
  await page.click("#el-id-2926-574");
  await page.type("#el-id-2926-574", '1');
}

