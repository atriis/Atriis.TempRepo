/*
 * Test Name: 22999 MERGED benerail booking + approval flow for benerail cost, cabin class, destination, policy and policy rule
 * Description: the trip goes to the right approvers in case benerail - cost, cabin class, destination, policy, policy rule
+validate mobile barcode in cart and itinerary mail
 * Status: Active
 * Labels: Approval flow,Financial Reference Code,NL government,No Amadeus Hotel Book,Full Purchase,Pre Prod,Sanity,Bene seats,Daily Transportation,Benerail Moove Regression,Transportation,2026 plan 1,02
 * Owner: Shani Hadar
 * Created: 2023-11-28T09:14:11Z
 * Updated: 2026-02-11T04:13:48Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('Shani@Testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('beny cohen');
  await Search_Benerail_round_trip('BEBMI', 'NLASC');
  await click_on_proceed_after_search();
  await add_benerail_2_ways_from_search_results_to_cart();
  await checkout();
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(1) .ticket-subtitle > :nth-child(5) .btn", 'Fare Rules');
  await page.waitFor(10000);
  await refresh_tab();
  await Validate_mobile_barcode_in_cart_and_iti_mail();
  await validate_approvers();
  await Cancel_quote_from_cart_after_checkout_with_warning();
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
  const boolean_61 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_61) {
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

async function Search_Benerail_round_trip(from, to) {
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
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

async function choose_financial_reference___benerail_1() {
  await page.click("[aria-label='Financial Reference'] .el-select__caret");
  await page.click("[x-placement='bottom-start'] span");
  await page.click("body > :nth-child(13) .btn--primary");
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

async function refresh_tab() {
  await page.reload();
}

async function checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await scrollTo(page, 0, 640);
  await waitForText(page, ".oop-title", 'Out of policy');
  await page.click(".oop-justification span");
  await page.click("#el-id-5730-1262 > span");
  await page.waitFor(1000);
  await page.click("[class^='px'], [class*=' px'] .btn");
  await accept_and_proceed_to_checkout();
  await choose_financial_reference___benerail_1();
  await Book_and_finalize();
  await page.waitFor(90000);
  await refresh_tab();
}

async function Validate_mobile_barcode_in_cart_and_iti_mail() {
  await scrollToElement(page, ".box-right > :nth-child(1)");
  await waitForText(page, ".box-right > :nth-child(1)", 'Mobile Barcode');
  await page.click(".box-right > :nth-child(1)");
  await page.waitFor(3000);
  //TODO Please add an assertion here
await isVisible(page, "#el-id-8895-1353 > div > div:nth-child(1) > img");
  await page.click("body > :nth-child(27) [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".trip-summary-container");
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-285 > li:nth-child(2)");
  await waitForText(page, "[align='right'] .em_grey_txt > :nth-child(5)", 'Beny cohen');
  await scrollTo(page, 0, 600);
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(10) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(2) > td > div > span", 'Mobile Bar Code:');
  await page.click("[aria-label='Share Itinerary'] > :nth-child(1) .el-dialog__close");
}

async function view_approvers_in_trip_overview() {
  await page.hover(".share-btn");
  await page.click(".share-popper > :nth-child(1)");
}

async function validate_approvers() {
  await page.waitForSelector(".ticket-details [class^='p'], [class*=' p'] > :nth-child(1) .btn", {state: "visible"});
  await waitForText(page, ".text--bold", 'Confirmed');
  await view_approvers_in_trip_overview();
  await waitForText(page, ".el-timeline > :nth-child(1) .approver-name", 'Olga Cohen');
  await waitForText(page, ".el-timeline > li:nth-of-type(2) .approver-name", 'poli Cohen');
  await waitForText(page, ".el-timeline > li:nth-of-type(3) .approver-name", 'Bina Cohen');
  await waitForText(page, ".el-timeline > li:nth-of-type(4) .approver-name", 'Dina Testimcorpnl');
  await waitForText(page, ".el-timeline > li:nth-of-type(5) .approver-name", 'mali Cohen');
  // Converting a 'validation-code-step' step has to be done manually at this time
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 5 more to go...');
  }
  await page.click("body > :nth-child(19) .el-icon");
}

async function cancel_validation() {
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  await page.click(".close-btn");
}

async function Cancel_quote_from_cart_after_checkout_with_warning() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await waitForText(page, ".btn--primary", 'Cancel item');
  await page.click("[aria-label='Cancel item - Chester Hotel Victoria'] .btn--primary");
  await cancel_validation();
}

