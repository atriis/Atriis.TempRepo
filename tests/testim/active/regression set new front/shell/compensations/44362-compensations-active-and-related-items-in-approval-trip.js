/*
 * Test Name: 44362 Compensations active and related items- in approval trip
 * Description: 
 * Status: Active
 * Labels: Regression,Cart,Approval flow,Amadeus,Flights,Compensation,Full Purchase,2026 plan 1
 * Owner: pini harush
 * Created: 2024-04-02T10:14:01Z
 * Updated: 2025-07-21T03:06:46Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Compensations@active.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('LON', 'BOS');
  await Add_flight_from_results_page_to_cart();
  await scrollToElement(page, ".compensation-quote-card a");
  await waitForText(page, ".compensation-quote-card .has-text-weight-semibold", 'Climate Contribution');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click(".compensation-quote-card a");
  await waitForText(page, ".terms-dialog p", /The compensation purchase associated with your booking/);
  await page.click(".terms-dialog .el-dialog__close");
  await page.click(".compensation-quote-card .el-checkbox__inner");
  await page.click(".flight-quote-card .el-checkbox__inner");
  await page.click(".btn-container span");
  await Price_change_prompt();
  await waitForText(page, ".last .summary-title", 'Carbon offset');
  //TODO Please add an assertion here
await getText(page, "[class^='ml'], [class*=' ml'] .amount");
  //TODO Please add an assertion here
await getText(page, ".last .amount");
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await validate_number1_number2_number3(flight, carbon, flt_and_co2);
  await page.click(".is-hidden-mobile");
  //TODO Please add an assertion here
await isVisible(page, ".compensation");
  await waitForText(page, ".el-card__body > :nth-child(2) .quote-results__status", 'On Hold');
  await Click_Go_to_Trip();
  await waitForText(page, ".is-uppercase", 'IN APPROVAL');
  await waitForText(page, ".flight-quote-card .has-text-weight-semibold", /Flight to/);
  await Skip_approval_flow_from_manually();
  await page.waitFor(8000);
  await refresh_tab();
  await waitForText(page, ".finalizing", 'Finalizing');
  await waitForText(page, "[aria-describedby='el-tooltip-5132']", /(On hold)|(Confirmed)/);
  await page.click(".compensation-quote-card .ticket-layout > :nth-child(3) div .btn");
  await waitForText(page, "body > :nth-child(13) .quote-title", /Flight to/);
  await page.click("body > :nth-child(13) .el-dialog__close");
  await Trip_Cancelation_flt_compensation();
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

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
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

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Skip_approval_flow_from_manually() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#dropdown-menu-4234 > li:nth-child(1)");
  await page.click("body > :nth-child(13) .btn");
  await page.click("footer > :nth-child(1)");
  await page.click("body > :nth-child(13) [class^='ml'], [class*=' ml']");
  await waitForText(page, ".status-desc", /No pending items/);
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function refresh_tab() {
  await page.reload();
}

async function Trip_Cancelation_flt_compensation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await waitForText(page, ".quote-details-container > :nth-child(2) .bold-text", 'Climate Contribution');
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

