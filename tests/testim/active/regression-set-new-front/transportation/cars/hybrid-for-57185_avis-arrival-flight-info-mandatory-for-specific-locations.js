/*
 * Test Name: Hybrid for 57185 - Avis: Arrival flight info mandatory for specific locations
 * Description: 
 * Status: Active
 * Labels: Gray Dawes,Galileo,Cars,Cart,Flights,Regression,Transportation,Cancel by process,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-01-21T08:12:14Z
 * Updated: 2026-02-16T05:07:50Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('carCorp@gdg.com');
  await case_1();
  await case_2();
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

async function New_Trip() {
  await book_a_new_trip();
  await waitForText(page, ".imt-btn", 'Add me');
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

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
}

async function search_car_by_place_and_AVIS_rental_agency(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click("#el-id-528-291");
  await page.type("#el-id-528-291", 'ZI');
  await page.click("#el-id-528-211 > span");
  await page.click(".btn");
  await old2();
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Search_Car() {
  await search_car_by_place_and_AVIS_rental_agency('CVG');
  await waitForText(page, ".car-list > :nth-child(2) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
  await scrollToElement(page, ".car-list > :nth-child(3) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".car-list > :nth-child(3) [class^='btn--width'], [class*=' btn--width']");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Validate_flight_info_required_and_checkout() {
  await scrollTo(page, 0, 600);
  //TODO Please add an assertion here
await isVisible(page, "[class^='px'], [class*=' px'] .has-text-danger");
  await page.click(".car-sunnycars-flight .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, ".field");
  await page.click("#el-id-8830-391");
  await page.type("#el-id-8830-391", 'UA086');
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".filled");
  await page.click(".el-checkbox__inner");
  await page.click(".btn-container span");
  await waitForText(page, ".price-summary p", 'Total');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__title", 'Success');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function Cancel_quote() {
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".app-label", 'Confirmed');
  await Trip_Cancelation();
}

async function case_1() {
  await New_Trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Car();
  await Validate_flight_info_required_and_checkout();
  await Cancel_quote();
}

async function Generate_random_first_and_last_name() {
  await page.evaluate(() => {
    //Arrays containing first names and last names
    
    const firstNames = [
    
      "Tyler",
      "Levi",
      "Daniel",
      "David",
      "William",
      "Adam",
      "Alex",
      "Christian",
      "Jacob",
      "Stephan",
      "Elijah",
      "David",
      "Diego",
      "Owen",
      "Ethan",
      "Jaylen",
      "Leandro",
      "Lucas",
      "Damian",
      "Austin",
      "Mateo",
      "Elias",
      // Add more first names here
    
    ];
    
    const lastNames = [
    
      "Sullivan",
      "Green",
      "Lee",
      "Leigh",
      "Diaz",
      "Morgan",
      "Bishop",
      "Pereira",
      "Silva",
      "Quinn",
      "Casey",
      "Reyes",
      "Murray",
      "Dimitriou",
      "Avery",
      "Griffin",
      "Silva",
      "Adams",
      "Kroll",
      "Kohler",
      "Evans",
      "Martin",
      "Hughes",
      // Add more last names here
    
    ];
    
    // Function to generate a random name
    
    function generateRandomFirstName() {
    
      const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    
      exportsTest.randomFN = randomFirstName;
    
    }
    
    function generateRandomLastName() {
    
      const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
      exportsTest.randomLN = randomLastName;
    
    }
    
    // Example usage
    
    const randomFName = generateRandomFirstName();
    
    console.log(randomFName);
    
    
    const randomLName = generateRandomLastName();
    
    console.log(randomLName);
  });
}

async function Add_traveler___random_guest() {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  if (false) {
    await page.click(".personal-info-container .is-transparent span");
  }
  await page.type("#el-id-9261-947", 'israel');
  await page.click("#el-id-9261-1058 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-5134-938 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
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

async function New_Trip__search_flights_and_add_to_cart() {
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".travelers-input .el-select__selection span", '1 Traveller');
  await Add_traveler___random_guest();
  await Search_flights_round_trip('SJC', 'PHX');
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  await scrollToElement(page, ".flight-list > :nth-child(1) .btn--primary");
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".app-label--quote", 'Pending booking');
}

async function Search_car_with_Avis__add_to_trip() {
  await page.click(".flicking-camera > :nth-child(3) .icon-text");
  //TODO Please add an assertion here
await isVisible(page, ".is-filterable");
  await page.click(".is-one-quarter-desktop [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-8931-1398", 'Avis');
  await page.click("#el-id-8931-1323 > span");
  await page.click(".btn--size-large");
  await waitForText(page, ".car-list > :nth-child(2) [class^='mt'], [class*=' mt'] p", 'Terms & Conditions');
  await scrollToElement(page, ".car-list > :nth-child(3) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".car-list > :nth-child(3) [class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".flight-quote-card .has-text-weight-bold", 'Pending booking');
}

async function Validate_flight_info_for_car_quote__parsed_from_flight_in_cart() {
  //TODO Please add an assertion here
await getText(page, ".not-last-segment .carrier-container div > :nth-child(2)");
  await scrollToElement(page, ".car-sunnycars-flight .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, "[class^='pb'], [class*=' pb'] .material-symbols-outlined");
  await page.click(".car-sunnycars-flight .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, "[class^='pb'], [class*=' pb'] .btn--default");
  await waitForText(page, ".el-input__inner", arrivingFlight);
}

async function Checkout_to_complete_booking() {
  await page.click(".car-quote-card .el-checkbox__inner");
  await page.click(".flight-quote-card .el-checkbox__inner");
  await page.click(".btn-container span");
  await waitForText(page, ".price-summary p", 'Total');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__description", 'Your order has been processed, but some items are still being confirmed');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".finalizing", 'Finalizing');
}

async function Trip_Cancellation___Pass_on_Warning() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function case_2() {
  await New_Trip__search_flights_and_add_to_cart();
  await Search_car_with_Avis__add_to_trip();
  await Validate_flight_info_for_car_quote__parsed_from_flight_in_cart();
  await Checkout_to_complete_booking();
  await Trip_Cancellation___Pass_on_Warning();
}

