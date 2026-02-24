/*
 * Test Name: 37145 MERGED send hotel price offer and itinerary from cart + mandatory and optional notifications on GDS hotel + Financial references are taken from the primary traveler - booker
 * Description: 
 * Status: Active
 * Labels: Share Itinerary,share quote,Hotel,No Amadeus Hotel Book,Regression,push notifications,Financial Reference Code,NL government,Amadeus Value hotel,Daily Hotels,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-01-30T12:15:44Z
 * Updated: 2025-12-08T02:00:47Z
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
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('zimbabwe');
  await NL___fill_ref_field_education_and_courses();
  await Filter_hotel_results_page('Bulawayo Central');
  await If_no_results_for_the_specific_hotel___remove_the_filter();
  await Copy_of_add_hotel_from_search_results_to_cart();
  await waitForText(page, ".payments-title", 'Trip overview');
  await validate_notifications();
  await validate_share_quote();
  await waitForText(page, ".app-label", 'Pending booking');
  await waitForText(page, ".ticket-top-section p", 'Refundable');
  await validate_share_itinerary();
  await go_to_checkout();
  await validate_financial_reference();
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

async function NL___fill_ref_field_education_and_courses() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("body > :nth-child(13) .btn--primary");
}

async function Filter_hotel_results_page(name) {
  await waitForText(page, ".app-price-slider .filter-name", 'Price');
  await page.type("#el-id-3990-1048", name);
  await page.waitFor(1000);
}

async function If_no_results_for_the_specific_hotel___remove_the_filter() {
  if (await getText(page, "h3") === "'No results found'") {
    await page.type("#el-id-4141-384", '');
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

async function Copy_of_add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
}

async function validate_notifications_on_the_screen() {
  await page.click("body > :nth-child(12) .el-dialog__title");
  await waitForText(page, "[role='alert'] p", 'optional message for GDS hotel in zimbabwe');
  await waitForText(page, ".mt5", 'mandatory message for GDS hotel in zimbabwe');
  await page.waitFor(3000);
  await waitForText(page, ".fs1", 'Got it');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click("body > :nth-child(10) .el-checkbox__inner");
  await page.click("body > :nth-child(10) .btn");
}

async function refresh_tab_2() {
  await page.reload();
}

async function validate_notifications_on_notification_center() {
  await page.click(".dot");
  await waitForText(page, ".notification-container > :nth-child(2) .notification-text", 'optional message for GDS hotel in zimbabweMark as read');
  await waitForText(page, ".notification-container > div:nth-of-type(4) span", 'optional message for GDS hotel in zimbabwe');
  await waitForText(page, ".notification-container > :nth-child(5) span", 'mandatory message for GDS hotel in zimbabwe');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click(".link-color");
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_notifications() {
  await validate_notifications_on_the_screen();
  await page.waitFor(2000);
  await refresh_tab_2();
  await validate_notifications_on_notification_center();
  await page.click(".close");
}

async function validate_share_quote() {
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-6505 > li:nth-child(1)");
  await waitForText(page, ".is-9 .label", 'Send to');
  await page.click("body > :nth-child(14) .btn--primary");
  await waitForText(page, ".el-notification__title", 'Success');
  await page.waitFor(2000);
}

async function validate_share_itinerary() {
  await page.hover(".share-icon");
  await page.click("#el-id-3029-57 > li:nth-child(2)");
  await waitForText(page, ".is-9 .label", 'Send to');
  await page.click("body > :nth-child(14) .btn--primary");
  await waitForText(page, ".el-notification__title", 'Success');
}

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
}

async function fill_free_text_justification_in_cart_if_needed() {
  await scrollTo(page, 0, 493);
  if (await getText(page, ".oop-title") === "'Out of policy'") {
    await page.type("[autocomplete='off']", 'abc');
  }
  await page.waitFor(1000);
  if (await getText(page, ".help") === "'Please save your justification'") {
    await page.click("[id='pane-overview'] .btn");
  }
}

async function go_to_checkout() {
  await page.click(".el-checkbox__inner");
  await set_CVV_in_cart_if_needed();
  await fill_free_text_justification_in_cart_if_needed();
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function validate_financial_reference() {
  await page.click(".el-select__caret");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(1) span", 'uploadname10 (uploadcode10)');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(2) span", 'uploadname9 (uploadcode9)');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(3) span", 'uploadname8 (uploadcode8)');
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

