/*
 * Test Name: HYBRID for 72550 Exclude Hotel Price From Travel Plan Email
 * Description: 
 * Status: Active
 * Labels: Share Itinerary,Email,Hotel,Ratehawk Regression,Full Purchase,2026 plan 2
 * Owner: Shani Hadar
 * Created: 2026-01-14T06:58:05Z
 * Updated: 2026-01-15T08:33:43Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('Tal@Nopris.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('LON');
  await Add_hotel_from_search_results_to_cart();
  await validate_pending_booking_on_one_hotel_in_cart();
  await validate_fields_on_itinerary_preview();
  await page.click("body > :nth-child(25) .btn--primary");
  await Success_toast_alert();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Book_and_finalize();
  await validate_confirmed_on_one_hotel_in_cart();
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

async function Click_on_share_itinerary_from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-3021-171 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function validate_number_of_fields() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_fields_on_itinerary_preview() {
  await Click_on_share_itinerary_from_cart();
  await waitForText(page, "body > :nth-child(25) .el-checkbox__label", 'Include PDF');
  await waitForText(page, "[bgcolor='#1C73FF'] .em_grey_txt", /-/);
  await waitForText(page, "[width='68%'] .em_grey_txt > :nth-child(5)", 'Tel:');
  await waitForText(page, "[align='right'] .em_grey_txt", /Consultant name/);
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(4) tbody > :nth-child(1) > :nth-child(1)", 'Check-in');
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(4) tbody > :nth-child(1) > :nth-child(2)", 'Check-out');
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(4) tbody > :nth-child(1) > :nth-child(3)", 'Total nights');
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(4) tbody > :nth-child(1) > :nth-child(4)", 'Number of rooms');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await scrollTo(page, 0, 500);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(5) tbody > :nth-child(1) > :nth-child(1)", 'Guests');
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(5) tbody > :nth-child(1) > :nth-child(2)", 'Loyalty Program');
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > tr:nth-of-type(7) span", 'Cancellation Policy');
  await validate_number_of_fields();
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
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

async function validate_confirmed_on_one_hotel_in_cart() {
  await waitForText(page, ".app-label", 'Confirmed');
}

