/*
 * Test Name: 44424 Compensations on demand
 * Description: carbon calculation is correct according to all the items in the cart - not relevant now because we don't get results from the supplier
 * Status: Active
 * Labels: Regression,Cart,Approval flow,Amadeus,Flights,Compensation,Full Purchase,Manual Quote,2026 plan 1
 * Owner: pini harush
 * Created: 2024-04-04T01:53:03Z
 * Updated: 2025-07-28T10:24:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('On@demand.comp');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('LON', 'BOS');
  await Add_flight_from_results_page_to_cart();
  await scrollToElement(page, ".add-btn");
  await waitForText(page, "h2", 'Additional items');
  await page.click(".add-btn");
  await waitForText(page, ".compensation-quote-card .has-text-weight-semibold", 'Climate Contribution');
  await page.click(".compensation-quote-card a");
  await waitForText(page, "#el-id-4144-531 > p", 'The compensation purchase associated with your booking is non-refundable.');
  await page.click("body > :nth-child(31) [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await removed_until_we_wil_get_results_from_co2_supplier();
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

async function Search_flights_round_trip(from, to) {
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

async function add_manual_gs() {
  await page.click(".is-capitalized");
  await page.click("[id='tab-groundService'] p");
  await page.click("#el-id-2684-3844");
  await page.type("#el-id-2684-3844", 'london');
  await page.click("[id='el-id-2684-3729-item-0'] p");
  await page.click("#el-id-2684-3845");
  await page.type("#el-id-2684-3845", 'liverpool');
  await page.click("[id='el-id-2684-3732-item-0'] p");
  await page.click("#el-id-2684-3846");
  await page.click("[id='el-id-2684-3734'] tbody > tr:nth-of-type(7) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click("#el-id-2684-3735");
  await page.click("[id='el-id-2684-3736'] .btn-apply");
  await page.click("[data-gtm-form-interact-id='0'] > :nth-child(3) > :nth-child(1) svg");
  await page.click("[id*='id'] .el-vl__window div > :nth-child(8)");
  await page.click("[id*='id'] .el-vl__window div > :nth-child(4)");
  await page.click(".manual-select svg");
  await page.click("[id='el-id-2684-3827'] .el-vl__window div > :nth-child(3) span");
  await page.click("#el-id-2684-3855");
  await page.type("#el-id-2684-3855", 'limo');
  await page.click("#el-id-2684-3856");
  await page.type("#el-id-2684-3856", '334455');
  await page.click(".add-quote-btn");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function validate_number1_number2_number3___1(number1, number2, number3, tolerance) {
  await page.evaluate((number1, number2, number3, tolerance) => {
    let numA = parseFloat(number1);
    let numB = parseFloat(number2);
    let numC = parseFloat(number3);
    
    let sum = numA + numB;
    let tol = parseFloat(tolerance);
    const lowerBound = numC - tol;
    const upperBound = numC + tol;
    
    if (sum >= lowerBound && sum <= upperBound) {
        console.log("number 1 is "+ number1 +", number 2 is "+ number2+", number 3 is "+ number3+", tollerance is "+tolerance);
    } else {
        throw new Error("number 1 is "+ number1 +", number 2 is "+ number2+", number 3 is "+ number3+", tollerance is "+tolerance);
    }
  }, number1, number2, number3, tolerance);
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function removed_until_we_wil_get_results_from_co2_supplier() {
  if (true) {
    return;
  }
  await scrollTo(page, 0, 119);
  await add_manual_gs();
  await waitForText(page, ".flight-quote-card .has-text-weight-semibold", /Flight to/);
  await scrollToElement(page, ".compensation-quote-card .el-checkbox__inner");
  await page.click(".compensation-quote-card .el-checkbox__inner");
  await page.click(".flight-quote-card .el-checkbox__inner");
  await page.click(".btn-container span");
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".confirmed", /(On hold)|(Confirmed)/);
  await Click_Go_to_Trip();
  //TODO Please add an assertion here
await getText(page, ".flight-quote-card [class^='is-size'], [class*=' is-size']");
  await scrollTo(page, 0, 1325);
  //TODO Please add an assertion here
await getText(page, ".has-img-slot [class^='is-size'], [class*=' is-size']");
  //TODO Please add an assertion here
await getText(page, ".nowrap");
  await validate_number1_number2_number3___1(flight, gs, comp, 2);
  await Trip_Cancelation();
}

