/*
 * Test Name: 57947 By Schedule - Amadeus and Ypsilon - "My Selection" price is correct
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2025-02-10T01:06:00Z
 * Updated: 2025-08-07T02:40:20Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('mariafernanda@amadeusypsilonclub.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flight_round_trip_by_schedule('DUB', 'PRG');
  await Select_and_extract_values_roundtrip_flights_from_results_by_carrier__by_schedule_search_('LH', 'EI');
  //TODO Please add an assertion here
await getText(page, ".amount");
  await Check_if_first_segment___second_segment____my_selection(firstFlight, secondFlight, selection);
  await page.goto('https://ui.gtp-staging.com/home');
  await page.goto('https://ui.gtp-staging.com/trips/3528187/cart');
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

async function Select_and_extract_values_roundtrip_flights_from_results_by_carrier__by_schedule_search_(carrierFirstSegment, carrierSecondSegment) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.type("#el-id-3356-666", carrierFirstSegment);
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .price-wrapper > :nth-child(1) > :nth-child(2) .amount");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click("[id='el-id-2672-162'] > :nth-child(1) .el-checkbox__inner");
  await page.type("#el-id-3356-666", carrierSecondSegment);
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .price-wrapper > :nth-child(1) > :nth-child(2) .amount");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
}

async function Check_if_first_segment___second_segment() {
  await page.evaluate(() => {
    const first_Segment = parseFloat(firstSegment); // example value, parsed as float
    const second_Segment = parseFloat(secondSegment); // example value, parsed as float
    const my_Selection = parseFloat(mySelection); // example value, parsed as float
    const tolerance = 0.50; // tolerance for comparison
    
    // Check if the sum of first_Segment and second_Segment is close to my_Selection
    let sum = first_Segment + second_Segment; // ensure sum is a float (no need for parseFloat here, since both segments are already parsed)
    if (Math.abs(sum - my_Selection) <= tolerance) {
        console.log(`The sum of first_Segment + second_Segment (${first_Segment} + ${second_Segment} = ${sum}) is within the tolerance of ${tolerance} for my_Selection (${my_Selection}).`);
    } else {
        throw new Error(`The calculated sum is outside the tolerance. Calculated sum: ${sum}, my_Selection: ${my_Selection}`);
    }
    
  });
}

async function Check_if_first_segment___second_segment____my_selection(firstSegment, secondSegment, mySelection) {
  await Check_if_first_segment___second_segment();
}

