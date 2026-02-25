/*
 * Test Name: 64405 booking.com - credit card without card holder name and country
 * Description: 
 * Status: Active
 * Labels: Booking.com,FOP,Regression,No Amadeus Hotel Book,Hotel,Cart,2026 plan 2
 * Owner: Shani Hadar
 * Created: 2025-07-14T09:37:17Z
 * Updated: 2026-02-03T05:06:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('Rebecca@Cardin.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('lon');
  await Add_hotel_from_search_results_to_cart();
  await validate_pending_booking_on_one_hotel_in_cart();
  await validate_default_card();
  await validate_can_t_continue_without_filling_details();
  await validate_see_default_card_with_missing_details();
  await validate_can_t_save_without_filling_details();
  await validate_can_save_new_details();
  await validate_missing_details_on_card_with_no_country();
  await validate_can_t_continue_without_filling_details_1();
  await validate_can_fill_details_and_save();
  await validate_can_continue();
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

async function Add_hotel_from_search_results_to_cart() {
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

async function validate_pending_booking_on_one_hotel_in_cart() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function validate_default_card() {
  await waitForText(page, ".card-name", 'no holder name');
  await waitForText(page, ".last-four-digit", '****4580');
  await waitForText(page, ".error-border", 'Complete missing info');
}

async function validate_can_t_continue_without_filling_details() {
  await page.click(".el-checkbox__inner");
  await page.click(".btn-container span");
  await waitForText(page, ".form-payment-err", '*In order to proceed, please add all required information');
}

async function validate_see_default_card_with_missing_details() {
  await page.click(".error-border");
  await waitForText(page, ".selected-card .card-name > :nth-child(1)", 'no holder name');
  await waitForText(page, ".selected-card .card-name > :nth-child(2)", '**** **** **** 4580');
  await waitForText(page, ".selected-card .section-title", 'Missing details');
  await waitForText(page, ".label", 'Card holder name *');
  await waitForText(page, ".selected-card .btn", 'Save');
}

async function validate_can_t_save_without_filling_details() {
  await page.click(".selected-card .btn");
  await page.waitFor(2000);
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

async function validate_can_save_new_details() {
  await page.click("#el-id-9824-735");
  await page.type("#el-id-9824-735", 'lior vev');
  await page.click(".selected-card .btn");
  await waitForText(page, ".error-cvv", 'cancel cvv required');
  await page.click("#el-id-9824-737");
  await page.type("#el-id-9824-737", '123');
  await page.waitFor(1000);
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function validate_missing_details_on_card_with_no_country() {
  await page.click(".ticket-top-section .is-clickable");
  await waitForText(page, ".select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(2) .card-name > :nth-child(1)", 'no country');
  await waitForText(page, ".select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(2) .card-name > :nth-child(2)", '**** **** **** 1142');
  await page.click(".select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(2) [type='checkbox']");
  await waitForText(page, ".selected-card .section-title", 'Missing details');
  await waitForText(page, ".label", 'Country *');
  await waitForText(page, ".selected-card .btn", 'Save');
}

async function validate_can_t_continue_without_filling_details_1() {
  await page.click(".selected-card .btn");
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function validate_can_fill_details_and_save() {
  await page.click("[d='M831.872 340.864 512 652.672 192.128 340.864a30.592 30.592 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.592 30.592 0 0 0-42.752 0z']");
  await page.click("#el-id-2558-76");
  await page.click(".selected-card .btn");
  await Success_toast_alert();
  await page.waitFor(3000);
  await waitForText(page, ".fop-owner", 'Paid by  Corporate');
  await waitForText(page, ".card-name", 'no country');
}

async function Set_credit_card_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
}

async function Click_cart() {
  await page.click(".cart-btn .material-symbols-outlined");
  await page.waitForSelector(".page-layout-main .icon-img", {state: "visible"});
}

async function validate_can_continue() {
  await Set_credit_card_CVV_in_cart_if_needed();
  await page.waitFor(2000);
  await page.click(".btn-container span");
  await waitForText(page, "h1", 'Booking details');
  await Click_cart();
  await validate_pending_booking_on_one_hotel_in_cart();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

