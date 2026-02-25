/*
 * Test Name: HYBRID for 64445 Galileo - Validate sampling process for on-request bookings
 * Description: 
 * Status: Active
 * Labels: Cars,Galileo,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-07-15T04:10:50Z
 * Updated: 2025-09-02T11:47:43Z
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
  await Copy_of_Search_car_by_place('LHR');
  await Results____Add_to_trip__on_Request();
  await Pending_Booking___Wait_for_element_text();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Travellers_Ref_Questions();
  await Book_and_finalize___Progress_Page();
  await In_Progress_Page();
  await Click_Go_to_Trip();
  await Trip_Overview();
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

async function Copy_of_Search_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  //TODO Please add an assertion here
await getText(page, "[id='el-id-9087-96'] .today .el-date-table-cell__text");
  const boolean_19 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_19) {
    await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  }
  const boolean_20 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_20) {
    await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  }
  const boolean_21 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_21) {
    await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  }
  await page.click("#el-id-9045-278");
  const boolean_22 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay !== pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_22) {
    await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  }
  const boolean_23 = await page.evaluate((pickUpDate, inc) => {
    const testDay = (pickUpDate + inc <= 28) ? (pickUpDate + inc) : pickUpDate;
      return testDay === pickUpDate
    
  }, pickUpDate, 5).catch(() => false);
  if (boolean_23) {
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

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function Click_on_proceed_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Results____Add_to_trip__on_Request() {
  await waitForText(page, ".has-text-black", /Showing/);
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".el-switch__action");
  await waitForText(page, ".car-list > :nth-child(1) .car-features > :nth-child(1) p", 'On request');
  await page.click(".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await Click_on_proceed_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
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

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Trip_Overview() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await waitForText(page, ".more-details-btn", 'More details');
  await waitForText(page, ".app-label", 'In progress');
}

