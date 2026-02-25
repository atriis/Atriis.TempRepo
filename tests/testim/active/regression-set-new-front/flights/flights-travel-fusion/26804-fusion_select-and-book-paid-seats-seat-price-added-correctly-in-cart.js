/*
 * Test Name: 26804 Fusion - Select and book paid seats, seat price added correctly in cart
 * Description: 
 * Status: Active
 * Labels: Regression,Fusion,Seating,No Amadeus Hotel Book,2026 plan 1
 * Owner: Noam Miller
 * Created: 2023-07-30T07:51:32Z
 * Updated: 2025-10-01T07:56:22Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@fusion.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights();
  await Search_flight_in_results_page('U2');
  await Add_to_trip_flight();
  await Validate_seat_cost___flight_cost_equal_total_cost();
  await Complete_booking();
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

async function Search_flights() {
  await Search_flights_one_way('LON', 'PAR');
  await Flight___Results___Wait_for__Add_to_trip__text();
}

async function Search_flight_in_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Select_available_seat___span_contains_$() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    // Find all seat elements
    const seatElements = Array.from(document.querySelectorAll('.seat'));
    
    // Initialize an array to store seat elements that match your criteria
    const eligibleSeats = [];
    
    // Iterate through the seat elements
    seatElements.forEach(seatElement => {
      // Find the <span> element within the seat
      const spanElement = seatElement.querySelector('span');
      
      // Check if the span content contains "$"
      if (spanElement && spanElement.textContent.includes('$')) {
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
      console.error('No eligible seats found with content containing "$".');
    }
    
  });
}

async function Select_available_seat(element) {
  await page.evaluate((element) => {
    const availableSeats = Array.from(document.getElementsByClassName('seat'));
    const randomIndex = Math.floor(Math.random() * availableSeats.length);
    const selectedSeat = availableSeats[randomIndex];
    selectedSeat.click();
  }, element);
}

async function Add_seating() {
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await page.click(".flight-seating .is-clickable");
  await scrollToElement(page, ".muliBold");
  await page.click(".muliBold");
  await page.waitForSelector(".deck-wrapper", {state: "visible"});
  await Select_available_seat___span_contains_$();
  await Select_available_seat(".deck-wrapper");
  //TODO Please add an assertion here
await getText(page, ".el-drawer__open .amount");
  await page.click(".page-layout-main .btn--primary");
  await page.waitFor(5000);
  await page.waitForSelector(".success-icon", {state: "visible"});
}

async function Copy_of_validate_number1_number2_number3(number1, number2, number3) {
  await page.evaluate((number1, number2, number3) => {
    // Assuming number1, number2, and number3 are strings representing numeric values with optional dollar signs
    let numA = parseFloat(number1.replace('€', ''));
    let numB = parseFloat(number2.replace('€', ''));
    let numC = parseFloat(number3.replace('€', ''));
    
    // Check if parseFloat was successful
    if (isNaN(numA) || isNaN(numB) || isNaN(numC)) {
        throw new Error("Invalid numeric input. Please provide valid numeric values.");
    }
    
    // Check if the rounded sum of numA and numB is equal to the rounded numC
    if (Math.round(numA + numB) === Math.round(numC)) {
        console.log(`Number 1 is €{number1}, Number 2 is €{number2}, Number 3 is €{number3}. The rounded sum of Number 1 and Number 2 is equal to the rounded Number 3.`);
    } else {
        throw new Error(`Number 1 is €{number1}, Number 2 is €{number2}, Number 3 is €{number3}. The rounded sum of Number 1 and Number 2 is not equal to the rounded Number 3.`);
    }
  }, number1, number2, number3);
}

async function Validate_total_price_for_seating_in_price_breakdown() {
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".amounts > :nth-child(3) > :nth-child(1)", 'Other');
  //TODO Please add an assertion here
await getText(page, ".subtotal .amount");
  if (false) {
    await waitForText(page, ".amounts > :nth-child(3) .amount", totalForSeats);
  }
  await Copy_of_validate_number1_number2_number3(flightPrice, seatPrice, totalPrice);
  await page.click("#el-drawer__title > button > i");
}

async function Validate_seat_cost___flight_cost_equal_total_cost() {
  await Add_seating();
  await waitForText(page, ".text--bold", 'Pending booking');
  await page.click(".text--bold");
  await Validate_total_price_for_seating_in_price_breakdown();
  await page.waitForSelector(".timed-quote-badge", {state: "visible"});
}

async function Complete_booking() {
  await page.click("[type='number']");
  await page.type("[type='number']", '123');
  await scrollToElement(page, ".el-checkbox__inner");
  await page.click(".el-checkbox__inner");
  await page.waitFor(1000);
  await page.click(".btn-container span");
  await waitForText(page, ".contact-details-container [class^='is-size'], [class*=' is-size']", 'Contact details');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__description", 'Before completing the booking we need to verify your card');
  await page.click(".success-message__email span");
  await waitForText(page, ".quote-results__status", 'In Progress');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".price-breakdown-btn", 'Price Breakdown');
  await waitForText(page, ".amount", totalPrice);
}

