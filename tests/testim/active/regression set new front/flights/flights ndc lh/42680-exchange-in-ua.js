/*
 * Test Name: 42680 Exchange in UA
 * Description: 
 * Status: Active
 * Labels: United,Regression,Flights,Full Purchase,exchange,price,UA ndc,progress page,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-11-17T11:04:41Z
 * Updated: 2025-11-26T08:04:23Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bsua@bsua.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await book_LH_NDC_flight();
  await get_original_flight_details();
  await Old();
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

async function old_date_picker() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Depart Date']");
  await page.type("[placeholder='Depart Date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Depart Date']", 'Enter');
  await page.click("[placeholder='Return Date']");
  await page.type("[placeholder='Return Date']", returnDate);
  await sendSpecialCharacter(page, "[placeholder='Return Date']", 'Enter');
  await page.click(".trip-search-control");
}

async function Copy_of_Search_flights_round_trip(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  if (false) {
    await page.waitFor(500);
  }
  if (false) {
    await page.click("#el-id-4704-692-item-0 > div");
  }
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  if (false) {
    await page.click(".ellipsis");
  }
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click("[id='el-id-1490-54'] > :nth-child(1) .el-radio__label");
  await old_date_picker();
  await page.click(".search-btn");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
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

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function book_and_finalize_with_contact_details() {
  await waitForText(page, "h1", 'Booking details');
  await waitForText(page, ".el-checkbox__label", /share the contact details/);
  await waitForText(page, ".email-input [type='text']", /@/);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function book_LH_NDC_flight() {
  await Copy_of_Search_flights_round_trip('LAS', 'LAX');
  await Add_flight_from_results_page_to_cart();
  await Pending_Booking___Wait_for_element_text();
  await Accept_and_proceed_to_checkout();
  await Price_change_prompt();
  await book_and_finalize_with_contact_details();
}

async function get_original_flight_details() {
  await waitForText(page, ".not-last-segment .flight-duration > :nth-child(1) .loc-code", 'LAS');
  await waitForText(page, ".not-last-segment .is-align-items-end .loc-code", 'LAX');
  //TODO Please add an assertion here
await getText(page, ".amount");
  //TODO Please add an assertion here
await getText(page, ".amount");
  //TODO Please add an assertion here
await getText(page, ".not-last-segment .flight-duration > :nth-child(1) .flight-date");
}

async function click_on_change_flight() {
  await page.hover("[aria-controls='dropdown-menu-6535']");
  await page.click("#dropdown-menu-6535 > li > p");
  await waitForText(page, ".page-view [disabled='disabled']", 'Change flight');
}

async function change_return_date() {
  await page.click(".flight-segments-container > :nth-child(2) .el-checkbox__inner");
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  await page.click("[readonly='readonly']");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  //TODO Please add an assertion here
await getText(page, "#el-id-1405-1832");
  if (false) {
    await page.type("[readonly='readonly']", newToDate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[readonly='readonly']", 'Enter');
  }
  await page.click(".btn-container .btn");
}

async function validate_details_and_proceed_with_the_new_flight() {
  await waitForText(page, "[class^='mb'], [class*=' mb']", 'Choose flight');
  await waitForText(page, ".flight-list > :nth-child(1) .carrier-name", 'United');
  if (false) {
    await waitForText(page, ".flight-list > :nth-child(1) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateSecondFormat+"$"));
  }
  await waitForText(page, ".flight-list > :nth-child(1) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateNumberOnly));
  await page.click(".flight-list > :nth-child(1) .btn");
  await waitForText(page, ".subtitle", 'Choose exchange flight');
  await waitForText(page, ".flight-info-wrapper > :nth-child(3) .flight-duration > :nth-child(1) .loc-code", 'LAX');
  await waitForText(page, ".flight-info-wrapper > :nth-child(3) .is-align-items-end .loc-code", 'LAS');
  await waitForText(page, ".flight-info-wrapper > :nth-child(2) .flight-duration > :nth-child(1) .loc-code", 'LAS');
  await waitForText(page, ".flight-info-wrapper > :nth-child(2) .is-align-items-end .loc-code", 'LAX');
  if (false) {
    await waitForText(page, ".flight-info-wrapper > :nth-child(3) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateSecondFormat+"$"));
  }
  await waitForText(page, ".flight-info-wrapper > :nth-child(3) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateNumberOnly));
  //TODO Please add an assertion here
await getText(page, ".flight-list > section:nth-of-type(1) .price .amount");
  //TODO Please add an assertion here
await getText(page, ".flight-list > section:nth-of-type(1) .price .amount");
  await page.click(".flight-list > section:nth-of-type(1) .add-btn");
  await waitForText(page, "h3", 'Your new flight');
  await waitForText(page, ".flight-segments-container > :nth-child(1) .flight-duration > :nth-child(1) .loc-code", 'LAS');
  await waitForText(page, ".flight-segments-container > :nth-child(1) .is-align-items-end .loc-code", 'LAX');
  await waitForText(page, ".flight-segments-container > :nth-child(2) .flight-duration > :nth-child(1) .loc-code", 'LAX');
  await waitForText(page, ".flight-segments-container > :nth-child(2) .is-align-items-end .loc-code", 'LAS');
  await waitForText(page, ".flight-segments-container > :nth-child(1) .flight-duration > :nth-child(1) .flight-date", originalFromDate);
  if (false) {
    await waitForText(page, ".flight-segments-container > :nth-child(2) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateSecondFormat+"$"));
  }
  await waitForText(page, ".flight-segments-container > :nth-child(2) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateNumberOnly));
  await page.click(".proceed-with-new-flight");
}

async function validate_number1_number2_number3(number1, number2, number3) {
  await page.evaluate((number1, number2, number3) => {
    let numA = parseFloat(number1);
    let numB = parseFloat(number2);
    let numC = parseFloat(number3);
    
    if (Math.round(numA + numB) === Math.round(numC)) {
        console.log("number 1 is"+ number1 +", number 2 is"+ number2+", number 3 is"+ number3+". The rounded sum of number1 and number2 is equal to the rounded number3.");
    } else {
        throw new Error("number 1 is"+ number1 +", number 2 is"+ number2+", number 3 is"+ number3+". The rounded sum of number1 and number2 is not equal to the rounded number3.");
    }
  }, number1, number2, number3);
}

async function validate_details_in_cart() {
  await waitForText(page, ".text--bold", 'Pending Reissue');
  await waitForText(page, ".not-last-segment .flight-duration > :nth-child(1) .loc-code", 'LAS');
  await waitForText(page, ".not-last-segment .is-align-items-end .loc-code", 'LAX');
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .flight-duration > :nth-child(1) .loc-code", 'LAX');
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .is-align-items-end .loc-code", 'LAS');
  await waitForText(page, ".not-last-segment .flight-duration > :nth-child(1) .flight-date", originalFromDate);
  if (false) {
    await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateSecondFormat+"$"));
  }
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .flight-duration > :nth-child(1) .flight-date", new RegExp(newToDateNumberOnly));
  await waitForText(page, ".quote-price .amount", newPrice);
  await waitForText(page, ".price-summary .amount", newPrice);
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await validate_number1_number2_number3(originalPriceNumberOnly, newPriceNumberOnly, totalPriceNumberOnly);
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

async function Verify_two_numbers_are_equal_1(firstValue, secondValue, tolerance) {
  await Verify_two_numbers_are_equal();
}

async function skip___check_rounded_prices() {
  if (true) {
    return;
  }
  //TODO Please add an assertion here
await getText(page, ".rate-information .subtotal .amount");
  await Verify_two_numbers_are_equal_1(originalPrice, originalPrice2, 0.09);
  //TODO Please add an assertion here
await getText(page, ".flight-exchange .subtotal .amount");
  await Verify_two_numbers_are_equal_1(newPrice, newPrice2, 0.09);
  //TODO Please add an assertion here
await getText(page, ".summary-and-actions .amount");
  await Verify_two_numbers_are_equal_1(totalPrice, totalPrice2, 0.09);
}

async function validate_details_in_price_breakdown() {
  await scrollToElement(page, ".price-breakdown-btn");
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".rate-information .original-price > :nth-child(1)", 'Price');
  await waitForText(page, ".rate-information .subtotal .amount", originalPrice);
  await waitForText(page, ".flight-exchange .subtotal .amount", newPrice);
  await waitForText(page, ".summary-and-actions .amount", totalPrice);
  await page.click("#el-drawer__title > button > i");
  await skip___check_rounded_prices();
}

async function reissue() {
  await Accept_and_proceed_to_checkout();
  await waitForText(page, ".contact-details-container .el-card__body > :nth-child(1) .label", 'Traveller Phone Number');
  await waitForText(page, "#el-id-575-570", /@/);
  await waitForText(page, ".is-hidden-mobile", 'Reissue');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__title", 'Success');
  await page.click(".btn-container > :nth-child(1)");
}

async function validate_details_in_cart_1() {
  await waitForText(page, ".text--bold", 'Ticketing Complete');
  await waitForText(page, ".amount", totalPrice);
  if (false) {
    await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .is-align-items-end .flight-date", new RegExp(newToDateSecondFormat+"$"));
  }
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .is-align-items-end .flight-date", new RegExp(newToDateNumberOnly));
  await scrollToElement(page, ".price-breakdown-btn");
}

async function validate_details_in_prce_breakdown() {
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".rate-information .subtotal .amount", originalPrice);
  await waitForText(page, ".flight-exchange .subtotal .amount", newPrice);
  await waitForText(page, ".summary-and-actions .amount", totalPrice);
}

async function Old() {
  if (true) {
    return;
  }
  await click_on_change_flight();
  await change_return_date();
  await validate_details_and_proceed_with_the_new_flight();
  await validate_details_in_cart();
  await validate_details_in_price_breakdown();
  await reissue();
  await validate_details_in_cart_1();
  await validate_details_in_prce_breakdown();
}

