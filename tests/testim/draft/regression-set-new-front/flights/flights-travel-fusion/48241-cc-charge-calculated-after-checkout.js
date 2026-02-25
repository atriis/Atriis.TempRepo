/*
 * Test Name: 48241 CC charge calculated after checkout
 * Description: 
 * Status: Draft
 * Labels: 
 * Owner: pini harush
 * Created: 2024-07-10T10:05:43Z
 * Updated: 2024-11-18T07:43:23Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('fusion2@nlTestim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('AMS', 'BCN');
  await waitForText(page, ".filter-name", 'Price');
  await page.type("[placeholder='Search flight']", 'hv');
  await page.waitFor(1000);
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".app-label--quote", 'Pending booking');
  await validate_and_extract_prices_before_checkout();
  await Accept_and_proceed_to_checkout();
  await waitForText(page, "h1", 'Booking details');
  await book_and_finalize();
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".more-details-btn", 'Flight details');
  await wait_until_ticketing();
  await price_validations_after_checkout();
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
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
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

async function validate_and_extract_prices_before_checkout() {
  await page.click(".price-breakdown-btn");
  //TODO Please add an assertion here
await getText(page, ".subtotal .amount");
  //TODO Please add an assertion here
await getText(page, ".subtotal .amount");
  await waitForText(page, ".amounts p", 'TBD');
  await page.hover(".info-icon");
  //TODO Please add an assertion here
await getText(page, "#el-id-5163-243 > ul > li:nth-child(3)");
  await waitForText(page, ".app-footer .amount", subtotalString);
  await page.click("[aria-label='Price Breakdown'] [xmlns='http://www.w3.org/2000/svg']");
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

async function book_and_finalize() {
  await waitForText(page, ".el-checkbox__label", /information/);
  await waitForText(page, ".email-input [type='text']", /@/);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__title", 'Card verification needed!');
  await page.waitFor(1000);
  await page.click(".success-message__email span");
  await page.waitFor(5000);
  await waitForText(page, ".success-message__title", 'Success');
}

async function refresh_tab() {
  await page.reload();
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress_1() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress_2() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress_3() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress_4() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress_5() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress_6() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_30_second_and_refresh_if_status_is_still_in_progress_7() {
  if (await getText(page, ".app-label") !== "'In progress'") {
    return;
  }
  await page.waitFor(30000);
  await refresh_tab();
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function wait_until_ticketing() {
  await wait_30_second_and_refresh_if_status_is_still_in_progress();
  await wait_30_second_and_refresh_if_status_is_still_in_progress_1();
  await wait_30_second_and_refresh_if_status_is_still_in_progress_2();
  await wait_30_second_and_refresh_if_status_is_still_in_progress_3();
  await wait_30_second_and_refresh_if_status_is_still_in_progress_4();
  await wait_30_second_and_refresh_if_status_is_still_in_progress_5();
  await wait_30_second_and_refresh_if_status_is_still_in_progress_6();
  await wait_30_second_and_refresh_if_status_is_still_in_progress_7();
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

async function price_validations_after_checkout() {
  await page.click(".price-breakdown-btn");
  //TODO Please add an assertion here
await getText(page, ".subtotal .amount");
  //TODO Please add an assertion here
await getText(page, ".subtotal .amount");
  await validate_number1_number2_number3(subtotalNumber, ccCharge, subtotalNumberAfterCheckout);
  await waitForText(page, ".app-footer .amount", subtotalStringAfterCheckout);
  await page.click("[aria-label='Price Breakdown'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".amount", subtotalStringAfterCheckout);
}

