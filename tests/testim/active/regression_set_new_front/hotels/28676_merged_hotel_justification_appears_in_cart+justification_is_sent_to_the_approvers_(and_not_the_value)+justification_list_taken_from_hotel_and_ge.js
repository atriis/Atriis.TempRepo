/*
 * Test Name: 28676 MERGED hotel justification appears in cart + justification is sent to the approvers (and not the value) + justification list taken from hotel and general +travel policy by rule (using dynamic and reference fields)
 * Description: 
 * Status: Active
 * Labels: Travel policy,justification,Email,Hotel,Approval flow,Financial Reference Code,NL government,Full Purchase,OOP,Regression,Amadeus Value hotel,Dynamic fields,Reference Fields,Daily Hotels,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-12-21T06:49:20Z
 * Updated: 2025-11-10T12:47:08Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('justin ruly');
  await Search_hotel_1_night('denver');
  await choose_type_of_trip___medical_leave();
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await validate_policy_in_results_page();
  await validate_policy_in_hotel_level();
  await scrollToElement(page, ".breadcrumb ul > li:nth-of-type(2) .router-link-active");
  await page.click(".breadcrumb ul > li:nth-of-type(2) .router-link-active");
  await add_hotel_from_search_results_to_cart();
  await validate_oop_and_justification();
  await Accept_and_proceed_to_checkout();
  await validate_can_t_proceed_without_justification();
  await validate_justfications___taken_from_hotel_and_general();
  await choose_justification_and_proceed();
  await select_first_financial_reference();
  await Price_change_prompt();
  await waitForText(page, "#el-collapse-head-1760 > div > span", 'Travellers Reference Questions');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await page.waitFor(10000);
  await validate_justification_text_appears_in_the_email();
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

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function choose_type_of_trip___medical_leave() {
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-9742-927 > span");
  await page.click("body > :nth-child(14) .btn--primary");
}

async function validate_policy_in_results_page() {
  await waitForText(page, ".hotel-list > :nth-child(1) .out-of-policy-badge", 'Out of policy');
  await page.hover("[aria-describedby='el-tooltip-8432']");
  await waitForText(page, "#el-tooltip-4707 > ul > li", 'Hotel cost per night is greater than or equals 20 EUR');
}

async function validate_policy_in_hotel_level() {
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".app-filter__content > :nth-child(2) h4", 'Payment');
  await scrollTo(page, 0, 600);
  await waitForText(page, ".room-list > :nth-child(2) .out-of-policy-badge", 'Out of policy');
  await page.hover(".room-list > :nth-child(2) [aria-describedby='el-tooltip-7958']");
  await waitForText(page, "#el-tooltip-8875 > ul > li", 'Hotel cost per night is greater than or equals 20 EUR');
}

async function loop() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

async function click_refundable_hotel() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    let refundableRoom=document.querySelector(".refundable.cancellation-terms");
    refundableRoom.parentElement.parentElement.parentElement.parentElement.children[1].firstChild.firstChild.firstChild.children[2].click()
  });
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
  await Pending_Booking___Wait_for_element_text();
  await waitForText(page, ".ticket-top-section p", 'Refundable');
}

async function validate_oop_and_justification() {
  await waitForText(page, ".out-of-policy-badge", 'Out of policy');
  await page.hover(".info-icon");
  await waitForText(page, "#el-id-1763-1404 > ul > li", 'Hotel cost per night is greater than or equals 20 EUR');
  await waitForText(page, ".oop-title", 'Out of policy');
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

async function validate_can_t_proceed_without_justification() {
  await waitForText(page, ".form-payment-err", '*In order to proceed, please add all required information');
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

async function validate_justfications___taken_from_hotel_and_general() {
  await page.click(".el-select__caret");
  await waitForText(page, "#el-id-4202-1651 > span", 'Breakfast is included in rate');
  await waitForText(page, "#el-id-4202-1652 > span", 'general a');
  await waitForText(page, "#el-id-4202-1653 > span", 'general b');
  await waitForText(page, "#el-id-4202-1654 > span", 'Hotel is combined with a economy ticket');
  await waitForText(page, "#el-id-4202-1655 > span", 'No hotel available within a short radius of venue');
  await waitForText(page, "#el-id-4202-1656 > span", 'No hotel available within rate limits');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function choose_justification_and_proceed() {
  await page.click(".el-scrollbar__view > li:nth-of-type(2) span");
  await page.waitFor(1000);
  await page.click("[id='pane-overview'] .btn");
  await page.waitFor(1000);
  await page.click(".btn-container span");
}

async function select_first_financial_reference() {
  await waitForText(page, ".is-capitalized", 'Financial Reference');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1763-1419 > span");
  await page.click("body > :nth-child(19) .btn--primary");
}

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function validate_justification_text_appears_in_the_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

