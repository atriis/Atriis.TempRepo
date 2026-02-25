/*
 * Test Name: 37302 [Merge] RateHawk - Total pricing with additional fees is correct, price does not change after adding to cart and booking is successful
 * Description: 
 * Status: Active
 * Labels: CR7,No Amadeus Hotel Book,Hotel,additional fees,merge,Ratehawk Regression,Pre Prod,price,Full Purchase,progress page,Giata,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-10-24T02:20:58Z
 * Updated: 2025-11-24T12:24:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('lidi@ratehawk.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('123 elysées - astotel');
  await Filter_by_refundable();
  await Check_terms___conditions();
  await Extracting_price_and_adding_hotel_to_cart();
  await Pending_booking___wait_for_element_text();
  await Making_sure__Refundable__in_cart();
  await Extracting_cart_price();
  await Open__More_Details__and_extract_price();
  await Pending_booking___wait_for_element_text();
  await Check_if_the_values_are_equal_1();
  await Check_if_the_values_are_the_same_in_room_level_results_page_and_cart();
  await Fill_free_text_justification_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await Hotels___Trip_Overview___Wait_for__Night__text_display();
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

async function scrollOnElement(page, selector, x, y) {
  await page.evaluate(([selector, x, y]) => {
    const element = document.querySelector(selector);
    element.scroll(x, y);
  }, [selector, x, y]);
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

async function add_traveler___I_am_the_traveler() {
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

async function Filter_by_refundable() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".app-filter__content > :nth-child(2) h4", 'Payment');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
}

async function Check_terms___conditions() {
  await page.click(".room-list > :nth-child(2) .no-padding");
  await waitForText(page, ".terms-title", 'Cancellation Policy');
  await page.click("body > :nth-child(15) .btn--text");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Extracting_price_and_adding_hotel_to_cart() {
  //TODO Please add an assertion here
await getText(page, ".room-list > :nth-child(2) .amount");
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Making_sure__Refundable__in_cart() {
  await waitForText(page, ".ticket-top-section p", 'Refundable');
}

async function Extracting_cart_price() {
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
}

async function Open__More_Details__and_extract_price() {
  await page.click(".ticket-top-section a > :nth-child(1)");
  await waitForText(page, ".row3 > :nth-child(1) span", 'Check in:');
  await scrollOnElement(page, ".el-drawer__body", 0, 484.9999694824219);
  //TODO Please add an assertion here
await getText(page, ".row8 .amount");
  await page.click("[aria-label='More details'] .btn");
}

async function Check_if_the_values_are_equal(valueMoreDetails, valueCart) {
  await page.evaluate((valueMoreDetails, valueCart) => {
    var moreDetails = valueMoreDetails
    moreDetails = parseFloat(moreDetails.replace(/[^\d\.]*/g, ''));
    
    var cart = valueCart
    cart = parseFloat(cart.replace(/[^\d\.]*/g, ''));
    
    if(moreDetails === cart){
        console.log("Values are equal " + moreDetails + " and " + cart)
    }
    else{
        throw new Error("Values are different, " + moreDetails + " and " + cart)
    }
    
  }, valueMoreDetails, valueCart);
}

async function Check_if_the_values_are_equal_1() {
  await Check_if_the_values_are_equal(valueMoreDetails, valueCart);
}

async function test(valueOne, valueTwo) {
  await page.evaluate((valueOne, valueTwo) => {
    var roomLevel = valueOne;
    roomLevel = parseFloat(roomLevel.replace(/[^\d\.]*/g, ''));
    
    var cart = valueTwo;
    cart = parseFloat(cart.replace(/[^\d\.]*/g, ''));
    
    // Define a more flexible tolerance value
    var tolerance = 5.00;  // Increase this value as needed
    
    if (Math.abs(roomLevel - cart) <= tolerance) {
        console.log("Values are approximately equal within tolerance: " + roomLevel + " and " + cart);
    } else {
        throw new Error("Values are different, " + roomLevel + " and " + cart);
    }
    
  }, valueOne, valueTwo);
}

async function Check_if_the_values_are_the_same_in_room_level_results_page_and_cart() {
  await test(valueRoomLevel, valueCart);
}

async function Fill_free_text_justification_in_cart_if_needed() {
  await scrollTo(page, 0, 493);
  if (await getText(page, ".oop-title") === "'Out of policy'") {
    await page.type("[autocomplete='off']", 'abc');
  }
  await page.waitFor(1000);
  if (await getText(page, ".help") === "'Please save your justification'") {
    await page.click("[id='pane-overview'] .btn");
  }
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

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Hotels___Trip_Overview___Wait_for__Night__text_display() {
  await waitForText(page, ".has-text-weight-semibold", /Night/);
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

