/*
 * Test Name: 22084 Financial reference codes are taken from the user group of the primary traveler - 1 guest as primary and 1 user
 * Description: the financial reference codes are taken from the primary traveler. in this test the primary is a guest
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-01-19T08:32:45Z
 * Updated: 2024-02-01T09:55:27Z
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
  await add_guest_Israel_Israeli___user_group_adis_ababa();
  await add_second_traveler_by_name('gadi');
  await Search_for_hotel_1_night('london');
  await fill_dynamic_field();
  await NL___fill_ref_field_education_and_courses();
  await add_hotel_from_search_results_to_cart();
  await go_to_checkout();
  await validate_financial_reference();
  await delete_one_and_only_qoute_from_cart_before_checkout();
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

async function add_guest_Israel_Israeli___user_group_adis_ababa() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click("[role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.waitFor(500);
  await page.click(".copy-settings-container [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.type("[placeholder='First Name']", 'Israel');
  await page.type("[placeholder='Middle Name']", 'Yakov');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.click("[aria-label='Next Year']");
  await page.click(".el-year-table tbody > :nth-child(3) > td:nth-of-type(2) .cell");
  await page.click(".el-month-table tbody > :nth-child(1) > td:nth-of-type(1) .cell");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(1) span");
  await page.click("[placeholder='Nationality']");
  await page.type("[placeholder='Nationality']", 'isr');
  await page.click(".natinolity-add-guest .el-scrollbar__view > :nth-child(108)");
  await page.type("[placeholder='Enter email address']", 'israel@israeli.com');
  await page.type("[placeholder='Enter phone number']", '04-6548745');
  await page.click("[placeholder='Mobile / Business...']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".add-guest-btn");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
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

async function Search_for_hotel_1_night(where) {
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

async function fill_dynamic_field() {
  await page.click("[name='Location travel policy']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
}

async function NL___fill_ref_field_education_and_courses() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("body > :nth-child(13) .btn--primary");
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

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
}

async function fill_justification_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  if (await isVisible(page, "[autocomplete='off']")) {
    await page.type("[autocomplete='off']", 'abc');
  }
}

async function go_to_checkout() {
  await page.click(".el-checkbox__inner");
  await set_CVV_in_cart_if_needed();
  await fill_justification_in_cart_if_needed();
  await page.waitFor(1000);
  if (false) {
    await page.click(".ticket-details p");
  }
  await page.click(".btn-container span");
}

async function validate_financial_reference() {
  await page.click(".el-select__caret");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(1) span", 'uploadname7 (uploadcode7)');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(2) span", 'uploadname5 (uploadcode5)');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(3) span", 'uploadname6 (uploadcode6)');
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function delete_one_and_only_qoute_from_cart_before_checkout() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await page.click("[aria-label='Cancel item - '] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  if (false) {
    await page.click("body > :nth-child(12) .btn--primary");
  }
  if (false) {
    await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  }
  await page.click(".close-btn");
}

