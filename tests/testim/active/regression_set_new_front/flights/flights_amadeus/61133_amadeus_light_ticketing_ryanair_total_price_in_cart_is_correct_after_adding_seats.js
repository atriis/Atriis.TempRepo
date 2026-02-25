/*
 * Test Name: 61133 Amadeus Light Ticketing - Ryanair - Total price in cart is correct after adding seats
 * Description: 
 * Status: Active
 * Labels: Amadeus,Flights,Ryanair,Regression,price,Cart,GDS,Seating,Amadeus Light Ticketing,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-04-22T10:33:23Z
 * Updated: 2025-09-25T08:32:00Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('lucasmoreira@amadeuslowcost.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('STN', 'BUD');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Filter_by_airline_using__Preferred_Airlines__filter_in_results('Ryanair');
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Adding_seats_and_extracting_values();
  await test_1(beforeSeating, seat, afterSeating);
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

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function test() {
  await page.evaluate(() => {
    const xpath = `//label[.//p[text()='${option}']]//span[contains(@class, 'el-checkbox__input')]`;
    
    const element = document.evaluate(
      xpath,
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    
    if (element) {
      element.click();
    } else {
      console.error(`Checkbox for '${option}' not found.`);
    }
    
  });
}

async function Filter_by_airline_using__Preferred_Airlines__filter_in_results(option) {
  await page.click(".carriers-filter .material-symbols-outlined");
  await test();
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Select_available_seat___span_contains__(element) {
  await page.evaluate((element) => {
    // Find all seat elements
    const seatElements = Array.from(document.querySelectorAll('.seat'));
    
    // Initialize an array to store seat elements that match your criteria
    const eligibleSeats = [];
    
    // Iterate through the seat elements
    seatElements.forEach(seatElement => {
      // Find the <span> element within the seat
      const spanElement = seatElement.querySelector('span');
      
      // Check if the span content contains $, €, or £
      if (spanElement && /[$€£]/.test(spanElement.textContent)) {
        eligibleSeats.push(seatElement);
      }
    });
    
    // Check if any eligible seats were found
    if (eligibleSeats.length > 0) {
      // Generate a random index to select a seat
      const randomIndex = Math.floor(Math.random() * eligibleSeats.length);
      
      // Select the randomly chosen seat
      const selectedSeat = eligibleSeats[randomIndex];
    
      // Trigger a click event on the selected seat
      selectedSeat.click();
    } else {
      throw new Error('No eligible seats found with content containing "$, €, or £".');
    }
    
  }, element);
}

async function Adding_seats_and_extracting_values() {
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await scrollToElement(page, ".flight-seating .card-title");
  await page.click(".flight-seating .is-clickable");
  await waitForText(page, "[id='pane-0'] .btn", 'Add Seats');
  await page.click("[id='pane-0'] .btn");
  await waitForText(page, ".flight-passengers .btn", 'Reset');
  await Select_available_seat___span_contains__();
  //TODO Please add an assertion here
await getText(page, ".seats .amount");
  await page.click(".btns-wrapper > :nth-child(2)");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await scrollToElement(page, ".filled");
}

async function test_1(firstValue, secondValue, expectedSum) {
  await page.evaluate((firstValue, secondValue, expectedSum) => {
    const firstValueParseFloat = parseFloat(firstValue);
    const secondValueParseFloat = parseFloat(secondValue);
    const expectedSumParseFloat = parseFloat(expectedSum);
    
    const actualSum = firstValueParseFloat + secondValueParseFloat;
    
    if (Math.abs(actualSum - expectedSumParseFloat) > 0.19) {
      throw new Error(`Sum does not match expected value. firstValue: ${firstValueParseFloat}, secondValue: ${secondValueParseFloat}, expectedSum: ${expectedSumParseFloat}, actualSum: ${actualSum}`);
    }
  }, firstValue, secondValue, expectedSum);
}

