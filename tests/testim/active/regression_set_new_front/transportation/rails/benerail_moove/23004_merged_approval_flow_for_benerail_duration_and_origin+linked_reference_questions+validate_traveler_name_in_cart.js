/*
 * Test Name: 23004 MERGED approval flow for benerail duration and origin + linked reference questions + validate traveler name in cart
 * Description: the trip goes to the right approvers in case benerail - duration, origin
 * Status: Active
 * Labels: Approval flow,Financial Reference Code,NL government,No Amadeus Hotel Book,Full Purchase,Reference Fields,search,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1,02
 * Owner: Shani Hadar
 * Created: 2023-12-20T06:34:41Z
 * Updated: 2026-02-03T09:44:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Shani@Testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('bina');
  await Search_benerail_by_place('NLBAN', 'amsterdam ce');
  await validate_fields();
  await add_benerail_2_ways_from_search_results_to_cart();
  await checkout();
  await validate_approvers();
  await Trip_Cancelation___warning_and_continue();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function Click() {
  if (true) {
    return;
  }
  const boolean_59 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_59) {
    await page.click("[aria-label='Next Month']");
  }
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
  await sendSpecialCharacter(page, ".from-row [placeholder='Date']", 'Enter');
  await page.click(".to-row [placeholder='Date']");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".to-row [placeholder='Date']", returnDate);
  await sendSpecialCharacter(page, ".to-row [placeholder='Date']", 'Enter');
}

async function Search_benerail_by_place(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.type("[placeholder='From... Station or Location']", from);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.type("[placeholder='To... Station or Location']", to);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.click(".from-row [placeholder='Date']");
  await page.click("[id='el-id-7687-293'] [aria-label='Next Month']");
  await page.click("[id='el-id-7687-293'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-7687-405");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    await page.click(".from-row [placeholder='Date']");
  }
  if (false) {
    //TODO Please add an assertion here
await getText(page, "[x-placement='bottom-start'] .el-date-picker__header");
  }
  await Click();
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(4)");
  }
  if (false) {
    await page.click(".to-row [placeholder='Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(5)");
  }
  await page.click(".search-btn");
  await old2();
}

async function validate_fields() {
  await page.waitFor(500);
  await waitForText(page, "body > :nth-child(17) [role='heading']", 'New trip reference fields');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[id='el-collapse-content-1096'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(5) span");
  await page.waitFor(100);
  await waitForText(page, "[id='el-collapse-content-3478'] .column > :nth-child(1) > :nth-child(2) > :nth-child(1) .label", '/Checked baggage?/');
  await waitForText(page, "[id='el-collapse-content-3478'] .column > :nth-child(1) > :nth-child(2) > :nth-child(2) .label", '/Odd sized baggage?/');
  await waitForText(page, "[id='el-collapse-content-3478'] .column > :nth-child(1) > :nth-child(2) > :nth-child(3) .label", '/Do you need a seat for an infant?/');
  await waitForText(page, "[id='el-collapse-content-3478'] .column > :nth-child(1) > :nth-child(2) > :nth-child(4) .label", '/Do you need us to arrange transportation of a pet?/');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[id='el-collapse-content-1102'] .column > :nth-child(1) > :nth-child(2) > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-9960-1158 > span");
  await page.waitFor(100);
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[name='Odd sized baggage?']");
  await page.click("#el-id-1937-1158 > span");
  await page.click("[id='el-collapse-content-3478'] .input-textbox [type='text']");
  await page.type("[id='el-collapse-content-3478'] .input-textbox [type='text']", '2');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[name='Do you need a seat for an infant?']");
  await page.click("#el-id-1937-1162 > span");
  await page.click("[name='Do you need us to arrange transportation of a pet?']");
  await page.click("#el-id-1123-1168 > span");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("body > :nth-child(13) .btn--primary");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_benerail_2_ways_from_search_results_to_cart() {
  await page.waitForSelector(".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", {state: "visible"});
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await page.click(".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']");
  await page.waitFor(3000);
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
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

async function accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function choose_financial_reference___benerail_2() {
  await page.click("[aria-label='Financial Reference'] .el-select__caret");
  await page.click(".el-select-dropdown span");
  await page.click("body > :nth-child(12) .btn--primary");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await waitForText(page, ".traveler-name", 'Bina Cohen');
  await waitForText(page, ".product-extra-info-price > :nth-child(1)", 'To pay');
  await accept_and_proceed_to_checkout();
  await choose_financial_reference___benerail_2();
  await waitForText(page, "h1", 'Booking details');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
}

async function validate_approvers() {
  await page.waitForSelector(".ticket-details [class^='p'], [class*=' p'] > :nth-child(1) .btn", {state: "visible"});
  await page.hover(".share-btn");
  await page.click(".share-popper > :nth-child(1)");
  await waitForText(page, ".el-timeline > :nth-child(1) .approver-name", 'Pini Cohen');
  await waitForText(page, ".el-timeline > :nth-child(2) .approver-name", 'Gadi Cohen');
  // Converting a 'validation-code-step' step has to be done manually at this time
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 2 more to go...');
  }
  await page.click("body > :nth-child(10) .el-dialog__close");
}

async function Trip_Cancelation___warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

