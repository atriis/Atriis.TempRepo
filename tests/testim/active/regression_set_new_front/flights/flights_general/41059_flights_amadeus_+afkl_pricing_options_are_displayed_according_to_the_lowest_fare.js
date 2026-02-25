/*
 * Test Name: 41059 Flights - Amadeus +AFKL - Pricing options are displayed according to the lowest fare
 * Description: 
 * Status: Active
 * Labels: Flights,Pricing Options,Amadeus,price,AFKL NDC Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-01-05T04:24:56Z
 * Updated: 2024-11-12T08:54:13Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('joana@amadeusandafklm.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('AMS', 'BHX');
  await waitForText(page, ".flight-list > :nth-child(1) .add-to-trip", 'Add to trip');
  await page.type("[placeholder='Search flight']", 'klm');
  await page.click(".flight-list > :nth-child(1) .pricing-options");
  await waitForText(page, "h2", /Flight/);
  //TODO Please add an assertion here
await getText(page, ".flicking-camera > :nth-child(1) .price-wrapper > :nth-child(2) .amount");
  //TODO Please add an assertion here
await getText(page, ".pricing-options-section > :nth-child(2) .amount");
  //TODO Please add an assertion here
await getText(page, ".pricing-options-section > :nth-child(3) .amount");
  await Comparing_two_values_to_see_if_they_are_equal_1();
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

async function Comparing_two_values_to_see_if_they_are_equal(firstValue, secondValue, thirdValue) {
  await page.evaluate((firstValue, secondValue, thirdValue) => {
    var increasing = firstValue <= secondValue && secondValue <= thirdValue;
    
    if (!increasing) {
      throw new Error(
        "Values are not increasing, first value is " +
          firstValue +
          ", second value is " +
          secondValue +
          " and third value is " +
          thirdValue
      );
    } else {
      console.log("Values are increasing correctly");
    }
  }, firstValue, secondValue, thirdValue);
}

async function Comparing_two_values_to_see_if_they_are_equal_1() {
  await Comparing_two_values_to_see_if_they_are_equal(firstValue, secondValue, thirdValue);
}

