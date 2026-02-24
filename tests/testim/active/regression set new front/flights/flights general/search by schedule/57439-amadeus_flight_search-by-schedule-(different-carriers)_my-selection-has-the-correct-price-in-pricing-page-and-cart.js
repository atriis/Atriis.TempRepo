/*
 * Test Name: 57439 Amadeus - Flight - Search by schedule (different carriers) - "My Selection" has the correct price in pricing page and cart
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,by schedule,price,Amadeus,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-01-30T08:16:30Z
 * Updated: 2025-08-26T08:27:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimendes@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flight_round_trip_by_schedule('DUB', 'PAR');
  await Selecting_first_segment();
  await Selecting_second_segment();
  await Adding__My_Selection__to_cart();
  await My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart_1();
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

async function Search_flight_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function Selecting_first_segment() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await Search_flight_results_page('AF');
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .amount");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
}

async function Selecting_second_segment() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await Search_flight_results_page('EI');
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .amount");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await page.waitForSelector(".flights-by-schedule-selected-segments .title", {state: "visible"});
  await waitForText(page, ".more-info .el-tooltip__trigger > :nth-child(2)", 'Separated Tickets');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Adding__My_Selection__to_cart() {
  await waitForText(page, ".pricing-options-container > :nth-child(1) .btn--primary", 'Add to trip');
  //TODO Please add an assertion here
await getText(page, ".pricing-options-container > :nth-child(1) .amount");
  await page.click(".pricing-options-container > :nth-child(1) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
}

async function My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart(firstFlight, secondFlight, mySelection, priceCart) {
  await page.evaluate((firstFlight, secondFlight, mySelection, priceCart) => {
    const tolerance = 0.30; // tolerance constant for floating-point comparison
    
    const firstFlightParseFloat = parseFloat(firstFlight);
    const secondFlightParseFloat = parseFloat(secondFlight);
    const mySelectionParseFloat = parseFloat(mySelection);
    const priceCartParseFloat = parseFloat(priceCart);
    
    const sumFirstAndSecondFlight = firstFlightParseFloat + secondFlightParseFloat;
    
    // Check if the sum of first and second flight is approximately equal to "My Selection" within the tolerance
    if (Math.abs(sumFirstAndSecondFlight - mySelectionParseFloat) <= tolerance) {
        console.log(
            `The sum of first flight (${firstFlightParseFloat}) ` +
            `and second flight (${secondFlightParseFloat}) ` +
            `is approximately equal to "My Selection" (${mySelectionParseFloat}).`
        );
    } else {
        throw new Error(
            `The sum of first flight (${firstFlightParseFloat}) ` +
            `and second flight (${secondFlightParseFloat}) ` +
            `is not approximately equal to "My Selection" (${mySelectionParseFloat}).`
        );
    }
    
    // Check if "My Selection" is approximately equal to the price in the cart within the tolerance
    if (Math.abs(mySelectionParseFloat - priceCartParseFloat) <= tolerance) {
        console.log(
            `Price in cart is correct. "My Selection" (${mySelectionParseFloat}) ` +
            `is approximately equal to the total value in cart (${priceCartParseFloat}).`
        );
    } else {
        throw new Error(
            `Price in cart is incorrect. "My Selection" (${mySelectionParseFloat}) ` +
            `and the total value in cart (${priceCartParseFloat}) do not match.`
        );
    }
    
  }, firstFlight, secondFlight, mySelection, priceCart);
}

async function My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart_1() {
  await My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart(first_Flight, second_Flight, my_Selection, price_Cart);
}

