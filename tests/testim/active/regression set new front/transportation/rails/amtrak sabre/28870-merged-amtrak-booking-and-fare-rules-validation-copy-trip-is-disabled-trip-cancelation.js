/*
 * Test Name: 28870 MERGED Amtrak booking and fare rules validation, copy trip is disabled, trip cancelation
 * Description: 
 * Status: Active
 * Labels: Copy Trip,Fare Rules,Full Purchase,Pre Prod,Daily Transportation,Regression,Amtrak Sabre,Transportation,2026 plan 1
 * Owner: Noam Miller
 * Created: 2023-12-31T06:49:27Z
 * Updated: 2026-02-11T05:31:45Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('bar@amtrak.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Amtrak_round_trip('NYP', 'WAS');
  await If_ref_field();
  await Amtrak_results___Check_fare_rules_and_add_to_trip();
  await Check_Fare_rules_in_cart();
  await Complete_required_fields_and_checkout();
  await Book_and_finalize();
  await Amtrak_fare_rules_in_cart__after_checkout();
  await Not_eligible_for_copy_trip();
  await Cancel_Amtrak_with_refund();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
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

async function Search_Amtrak_round_trip(fromStation, toStation) {
  await page.click(".el-tabs__header .el-input");
  await page.click("#el-id-3445-21");
  await page.type("[placeholder='From... Station or Location']", fromStation);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.type("[placeholder='To... Station or Location']", toStation);
  await page.click("[id='el-id-4566-49-item-0'] p");
  await page.click("#el-id-1388-375");
  await page.click("[id='el-id-1388-296'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-1388-296'] tbody > :nth-child(3) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-1388-379");
  await page.click("[id='el-id-1388-331'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".is-paddingless .control");
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

async function If_ref_field() {
  await page.click(".el-collapse-item__wrap [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1044-415 > span");
  if (false) {
    await page.type("#el-id-766-703", 'business');
  }
  await Click_on_proceed_after_search();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Amtrak_results___Check_fare_rules_and_add_to_trip() {
  await waitForText(page, "[class^='mr'], [class*=' mr']", 'Sort by');
  await page.click(".amtrak-list > :nth-child(3) .no-padding");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare Rules for NYP To WAS');
  //TODO Please add an assertion here
await isVisible(page, ".rules");
  await waitForText(page, ".rules > :nth-child(1) .mb-1", 'Cancellations');
  await waitForText(page, ".rules > :nth-child(2) .mb-1", 'Changes');
  await waitForText(page, "body > :nth-child(22) [target='_blank']", 'Supplier Terms & Conditions');
  await page.click("body > :nth-child(14) .el-dialog__close");
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".amtrak-list > :nth-child(2) .btn--primary", 'Select');
  await page.click(".amtrak-list > :nth-child(1) .no-padding");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare Rules for WAS To NYP');
  //TODO Please add an assertion here
await isVisible(page, ".rules");
  await waitForText(page, ".rules > :nth-child(1) .mb-1", 'Cancellations');
  await waitForText(page, ".rules > :nth-child(2) .mb-1", 'Changes');
  await page.click("body > :nth-child(15) .el-dialog__close");
  await scrollToElement(page, ".amtrak-list > :nth-child(6) .select-rail-btn");
  await page.click(".amtrak-list > :nth-child(6) .select-rail-btn");
  await page.click(".add-btn");
  await Pending_Booking___Wait_for_element_text();
}

async function Check_Fare_rules_in_cart() {
  await page.click(".amtrak-details > :nth-child(1) .btn");
  await waitForText(page, "body > :nth-child(13) .el-dialog__title", 'Fare rules');
  //TODO Please add an assertion here
await isVisible(page, "#el-id-6394-68 > section > div:nth-child(1)");
  await page.click("body > :nth-child(13) .el-dialog__close");
  await page.click(".amtrak-details > :nth-child(2) [class^='p'], [class*=' p']");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare rules');
  //TODO Please add an assertion here
await isVisible(page, "#el-id-6394-68 > section > div:nth-child(1)");
  await page.click("body > :nth-child(14) .el-dialog__close");
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

async function Complete_required_fields_and_checkout() {
  await scrollToElement(page, ".amtrak-contact-information .is-clickable");
  await page.click(".amtrak-contact-information .is-clickable");
  await waitForText(page, "[class^='px'], [class*=' px'] .btn--default", 'Cancel');
  await page.click("[maxlength='3']");
  await page.type("[maxlength='3']", '1');
  await page.click(".control > div:nth-of-type(2) [type='number']");
  await page.type(".control > div:nth-of-type(2) [type='number']", '310');
  await page.click(".control > div:nth-of-type(3) [type='number']");
  await page.type(".control > div:nth-of-type(3) [type='number']", '3338888');
  await page.click("[id='pane-overview'] .no-border");
  await page.waitForSelector(".success-icon", {state: "visible"});
  await accept_and_proceed_to_checkout();
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

async function Amtrak_fare_rules_in_cart__after_checkout() {
  await waitForText(page, ".amtrak-details > :nth-child(1) .btn", 'Fare Rules');
  await page.click(".amtrak-details > :nth-child(1) .btn");
  await waitForText(page, "#el-id-9645-123 > section > div:nth-child(1) > h4", /NYP/);
  await waitForText(page, ".rules > :nth-child(1) [class^='mb'], [class*=' mb']", 'Cancellations');
  await waitForText(page, ".rules > :nth-child(2) [class^='mb'], [class*=' mb']", 'Changes');
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function Not_eligible_for_copy_trip() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#el-id-39-547 > li:nth-child(2)");
  await waitForText(page, ".cancel-trip-modal > div:nth-of-type(1) p", 'The following items will be copied to a new trip');
  await waitForText(page, ".quote-details-container .regular-text", 'This item can not be copied');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click("[aria-label='Copy trip'] .el-dialog__close");
}

async function Cancel_Amtrak_with_refund() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#dropdown-menu-4040 > li:nth-child(2)");
  await waitForText(page, ".refund-msg", 'How would you like to be refunded?');
  //TODO Please add an assertion here
await isElementChecked(page, ".el-radio-group > :nth-child(1) .el-radio__input");
  await page.click(".btn--primary");
  await waitForText(page, ".msg-title", 'Cancellation confirmed!');
}

