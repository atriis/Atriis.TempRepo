/*
 * Test Name: 65398 Amadeus – Search by Schedule - Validate Inclusion of Both Segments in Round Trip with Same Low-Cost Carrier Trip with Same Low-Cost Carrier
 * Description: 
 * Status: Active
 * Labels: Flights,by schedule,Amadeus,Regression,Ypsilon,2026 plan 2
 * Owner: Sónia Sousa
 * Created: 2025-08-01T11:29:01Z
 * Updated: 2025-09-23T09:56:41Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('corporate.amadeus.lcc@soniatest.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip__by_schedule_('AMS', 'LON');
  await Select_flights_by_carrier__by_schedule____Select_option('EasyJet', 'EasyJet');
  await Click_on_proceed_after_search();
  await Add_flights_from_pricing_page_to_cart___Option_with_Not_Separate_Tickets();
  await Check____();
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

async function Search_flights_round_trip__by_schedule_(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id='el-id-520-61'] .arrow-right");
  await page.click("[id='el-id-520-61'] .is-right tbody > :nth-child(4) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function Search_flight_in_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function Select_flights_by_carrier__by_schedule____Select_option(carrierFirstSegment, carrierSecondSegment) {
  await Flight___Results___Wait_for__Select__text();
  await Search_flight_in_results_page(carrierFirstSegment);
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await Flight___Results___Wait_for__Select__text();
  await Search_flight_in_results_page(carrierSecondSegment);
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
}

async function Click_Proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await Click_Proceed();
}

async function Click_on_proceed_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flights_from_pricing_page_to_cart___Option_with_Not_Separate_Tickets() {
  await waitForText(page, ".pricing-options-container .title", 'Your selection');
  await waitForText(page, ".flight-by-schedule-pricing > :nth-child(3) [class^='mr'], [class*=' mr']", 'Additional pricing options');
  await page.click(".flight-by-schedule-pricing > :nth-child(3) .material-symbols-outlined");
  await page.click(".additional-pricing-options-wrapper > :nth-child(1) .btn--primary");
  await Click_on_proceed_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Check_if_there_are_two_legs() {
  await page.evaluate(() => {
    var areEqual = valueOutbound === valueInbound;
    
    if (!areEqual) {
      throw new Error('The strings are not equal. Value Outbound: ' + valueOutbound + ' Value Inbound: ' + valueInbound);
    }
    
    return areEqual;
  });
}

async function Check____() {
  await Pending_Booking___Wait_for_element_text();
  //TODO Please add an assertion here
await getText(page, ".not-last-segment .flight-duration > :nth-child(1) .loc-code");
  //TODO Please add an assertion here
await getText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .is-align-items-end .loc-code");
  await Check_if_there_are_two_legs();
}

