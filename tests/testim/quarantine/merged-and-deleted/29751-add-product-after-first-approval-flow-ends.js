/*
 * Test Name: 29751 add product after first approval flow ends
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-11-19T11:16:56Z
 * Updated: 2025-07-10T05:00:00Z
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
  await add_traveler_by_name('segev leshin');
  await Search_hotel_1_night('denver');
  await click_on_proceed_after_search();
  await add_hotel_from_search_results_to_cart();
  await Accept_and_proceed_to_checkout();
  await select_first_financial_reference();
  await send_for_approvals_and_go_back_to_trip_overview();
  await skip_approvers_of_first_approval_flow();
  await search_car_from_cart();
  await add_car_from_results_page_to_cart();
  await Accept_and_proceed_to_checkout();
  await send_for_approvals_amd_go_back_to_trip_overview();
  await validate_approver_in_approval_for_changes();
  await validate_approver_email();
  await click_on_approve(4);
  await page.waitFor(1000);
  await refresh_tab();
  await validate_approvers();
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
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

async function select_first_financial_reference() {
  await waitForText(page, ".is-capitalized", 'Financial Reference');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1763-1419 > span");
  await page.click("body > :nth-child(19) .btn--primary");
}

async function click_on_submit_for_approval() {
  await page.click("[class^='btn--width'], [class*=' btn--width']");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function send_for_approvals_and_go_back_to_trip_overview() {
  await click_on_submit_for_approval();
  await Click_Go_to_Trip();
}

async function view_approvers_in_trip_overview() {
  await page.hover(".share-btn");
  await page.click(".share-popper > :nth-child(1)");
}

async function skip_approvers_of_first_approval_flow() {
  await waitForText(page, "[class^='px'], [class*=' px']", 'Terms & Conditions');
  await view_approvers_in_trip_overview();
  await page.click("body > :nth-child(13) .btn");
  await page.click(".btns-container > :nth-child(1)");
  await page.click("body > :nth-child(13) [class^='ml'], [class*=' ml']");
  await waitForText(page, "#pane-active-approvers > div", 'No active approval flow');
  await page.click("[id='tab-approved-approvers'] p");
  await waitForText(page, ".p5 > :nth-child(2)", 'Approved by:                       Beny cohen ,                      Olga Cohen ,                      mali Cohen');
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function search_car_from_cart() {
  await page.click(".flicking-camera > :nth-child(3) .icon-text");
  await page.click("[valuekey='value']");
  await page.type("[valuekey='value']", 'lhr');
  await page.click("[role='region'] .has-text-weight-bold");
  await page.click("[placeholder='Pick-up Date']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(5) span");
  await page.click("[placeholder='Pick-up Time']");
  await page.click(".time-select .el-scrollbar__view > :nth-child(3)");
  await page.click("[placeholder='Drop-off Date']");
  await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(5) > td:nth-of-type(6) span");
  await page.click("[placeholder='Drop-off Time']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(3)");
  await page.click(".search-btn");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function send_for_approvals_amd_go_back_to_trip_overview() {
  await waitForText(page, "#el-collapse-head-5491 > div > span", 'Travellers Reference Questions');
  await click_on_submit_for_approval();
  await Click_Go_to_Trip();
  await waitForText(page, ".car-quote-card .more-details .is-flex", /More details/);
}

async function validate_approver_in_approval_for_changes() {
  await view_approvers_in_trip_overview();
  await waitForText(page, ".approver-name", 'Pini Cohen');
  await waitForText(page, "[id='pane-active-approvers'] .material-symbols-outlined", 'directions_car');
  await waitForText(page, ".active", 'ACTIVE');
  await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 1 more to go...');
  await page.click("[id='tab-approved-approvers'] p");
  await waitForText(page, ".p5 > :nth-child(2)", 'Approved by:                       Beny cohen ,                      Olga Cohen ,                      mali Cohen');
  await waitForText(page, "[id='pane-approved-approvers'] .material-symbols-outlined", 'domain');
  await waitForText(page, "[id='pane-approved-approvers'] .status-desc", /Approved on/);
  await page.click("body > :nth-child(16) .el-dialog__close");
}

async function validate_approver_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function click_on_approve(linkNumber) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function refresh_tab() {
  await page.reload();
}

async function validate_approvers() {
  await waitForText(page, ".car-quote-card .more-details .is-flex", /More details/);
  await view_approvers_in_trip_overview();
  await waitForText(page, "#pane-active-approvers > div", 'No active approval flow');
  await waitForText(page, ".btns-container .is-align-items-center", /Approved/);
  await page.click("[id='tab-approved-approvers'] p");
  await waitForText(page, "body > :nth-child(17) .hotel", 'domain');
  await waitForText(page, "[id='pane-approved-approvers'] .step-container > :nth-child(1) > :nth-child(1) .status-desc", /Approved on/);
  await waitForText(page, "#pane-approved-approvers > div > div > div > div:nth-child(1) > div:nth-child(2)", 'Approved by:                       Beny cohen ,                      Olga Cohen ,                      mali Cohen');
  await waitForText(page, "body > :nth-child(17) .car", 'directions_car');
  await waitForText(page, "[id='pane-approved-approvers'] .step-container > :nth-child(1) > :nth-child(2) .status-desc", /Approved on/);
  await waitForText(page, "#pane-approved-approvers > div > div > div > div:nth-child(2) > div:nth-child(2)", 'Approved by:                       Pini Cohen');
  await page.click("body > :nth-child(17) .el-dialog__close");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

