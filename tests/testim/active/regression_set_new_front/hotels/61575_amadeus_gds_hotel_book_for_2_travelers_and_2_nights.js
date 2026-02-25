/*
 * Test Name: 61575 Amadeus GDS hotel - book for 2 travelers and 2 nights
 * Description: 
 * Status: Active
 * Labels: Regression,Hotel,Full Purchase,more than 1 night,multi pax,Daily Hotels,Amadeus,progress page,66444 hotel results,Pre Prod,Giata,2026 plan 2
 * Owner: Shani Hadar
 * Created: 2025-05-04T07:05:40Z
 * Updated: 2026-02-09T12:53:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Amy@Gadasy.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await add_second_traveler_by_name('amy loyal');
  await Search_hotel_2_nights('lon');
  await click_on_proceed_after_search();
  await add_hotel_from_search_results_to_cart();
  await validate__pending_booking__on_one_hotel_in_cart();
  await waitForText(page, ".dates span", /2 Nights, 2 Rooms/);
  await set_CVV_in_cart_if_needed();
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await Accept_and_proceed_to_checkout();
  await Book_and_finalize();
  await validate__confirmed__on_one_hotel_in_cart();
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await Verify_two_numbers_are_equal_with_tolerance(priceBeforeCheckout, priceAfterCheckout, 0.2);
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

async function choose_checkin_date(element) {
  await page.evaluate((element) => {
    const dateElements = document.querySelectorAll('.el-date-table-cell__text');
    
    const targetDate = Array.from(dateElements).find(el => el.textContent.trim() === '15');
    
    if (targetDate) {
        targetDate.click();
    } else {
        console.error("Date element '15' not found.");
    }
  }, element);
}

async function choose_checkout_date(element) {
  await page.evaluate((element) => {
    const dateElements = document.querySelectorAll('.el-date-table-cell__text');
    
    const targetDate = Array.from(dateElements).find(el => el.textContent.trim() === '17');
    
    if (targetDate) {
        targetDate.click();
    } else {
        console.error("Date element '17' not found.");
    }
  }, element);
}

async function new_for_regression() {
  if (true) {
    return;
  }
  await page.click("[id='el-id-982-40'] .is-left tbody > :nth-child(5) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
}

async function old() {
  if (true) {
    return;
  }
  await page.click("[id='el-id-2517-26'] .is-right tbody > :nth-child(5) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
}

async function new_date_picker() {
  if (true) {
    return;
  }
  await page.click("[id='el-id-2517-26'] .is-right tbody > :nth-child(5) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
}

async function skip() {
  if (true) {
    return;
  }
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
}

async function old_1() {
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

async function Search_hotel_2_nights(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-2517-26'] .arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("[id='el-id-2517-26'] .arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await choose_checkin_date("[id='el-id-2434-40'] .is-right [aria-label='Use the arrow keys and enter to select the day of the month']");
  await page.waitFor(1000);
  await choose_checkout_date("[id='el-id-2434-40'] .is-right [aria-label='Use the arrow keys and enter to select the day of the month']");
  await new_for_regression();
  await old();
  await page.click(".search-btn");
  await new_date_picker();
  await skip();
  await old_1();
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

async function validate__pending_booking__on_one_hotel_in_cart() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
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

async function validate__confirmed__on_one_hotel_in_cart() {
  await waitForText(page, ".app-label", 'Confirmed');
}

async function Verify_two_numbers_are_equal() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, "")); 
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = Math.abs(firstNumberParseFloat - secondNumberParseFloat) <= tolerance;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
  });
}

async function Verify_two_numbers_are_equal_with_tolerance(firstValue, secondValue, tolerance) {
  await Verify_two_numbers_are_equal();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

