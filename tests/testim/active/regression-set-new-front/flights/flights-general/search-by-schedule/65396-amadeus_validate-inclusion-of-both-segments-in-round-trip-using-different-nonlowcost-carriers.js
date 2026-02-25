/*
 * Test Name: 65396 Amadeus – Validate Inclusion of Both Segments in Round Trip Using Different Non-Low-Cost Carriers
 * Description: 
 * Status: Active
 * Labels: Flights,by schedule,Amadeus,Regression,Low cost,Ypsilon,2026 plan 2
 * Owner: Sónia Sousa
 * Created: 2025-08-02T09:38:40Z
 * Updated: 2025-09-23T12:52:40Z
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
  await Search_flight_round_trip_by_schedule('LIS', 'BCN');
  await Select_flights_by_carrier__by_schedule_('LH', 'LX');
  await Add_flights_from_pricing_page_to_cart__by_schedule_();
  await Pending_Booking___Wait_for_element_text();
  await Round_trip_by_Schedule___Validate_Both_Segments_Included_in_Trip();
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

async function Search_flight_round_trip_by_schedule(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id*='id'] .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
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

async function Select_flights_by_carrier__by_schedule_(carrierFirstSegment, carrierSecondSegment) {
  await Flight___Results___Wait_for__Select__text();
  await Search_flight_in_results_page(carrierFirstSegment);
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await Flight___Results___Wait_for__Select__text();
  await Search_flight_in_results_page(carrierSecondSegment);
  await page.waitFor(2000);
  if (false) {
    await waitForText(page, ".flight-list > :nth-child(1) .flight-info-top-bar .is-align-items-center > :nth-child(2)", 'NDC direct rate');
  }
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flights_from_pricing_page_to_cart__by_schedule_() {
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
  await page.click(".pricing-options-container > :nth-child(1) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Round_trip_by_Schedule___Validate_Both_Segments_Included_in_Trip() {
  await waitForText(page, ".not-last-segment .flight-duration > :nth-child(1) .loc-code", 'BCN');
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .flight-duration > :nth-child(1) .loc-code", 'BCN');
}

