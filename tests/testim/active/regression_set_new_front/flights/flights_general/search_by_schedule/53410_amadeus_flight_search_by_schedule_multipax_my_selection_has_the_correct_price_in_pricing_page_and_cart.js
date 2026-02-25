/*
 * Test Name: 53410 Amadeus - Flight - Search by schedule - Multipax - "My Selection" has the correct price in pricing page and cart
 * Description: 
 * Status: Active
 * Labels: Regression,multi pax,Flights,by schedule,general,price,Amadeus,Daily Flights,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-10-22T09:27:10Z
 * Updated: 2026-02-13T08:27:08Z
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
  await Add_second_traveler___random_guest();
  await Search_flight_round_trip_by_schedule('SYD', 'MEL');
  await Copy_of_Select_flights_from_results__by_schedule_search_();
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_Booking___Wait_for_element_text();
  await Extracting_price_from_cart();
  await t();
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

async function Add_second_traveler___random_guest() {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-1-220 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  await page.type("#el-id-1-249", 'israel');
  await page.click("#el-id-1-360 > span");
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
  await page.click("#el-id-1-240 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".add-btn .material-symbols-outlined", {state: "visible"});
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

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Copy_of_Select_flights_from_results__by_schedule_search_() {
  await Flight___Results___Wait_for__Select__text();
  await Search_flight_in_results_page('Virgin Australia');
  await Flight___Click__Pricing_Options_();
  await waitForText(page, ".pricing-options-section > :nth-child(1) .btn--primary", 'Select');
  //TODO Please add an assertion here
await getText(page, ".pricing-options-section > :nth-child(2) .amount");
  await page.click(".pricing-options-section > :nth-child(2) .btn--primary");
  await waitForText(page, ".selected", 'Unselect');
  await page.click(".add-btn");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await Flight___Results___Wait_for__Select__text();
  await Search_flight_in_results_page('Qantas');
  await Flight___Click__Pricing_Options_();
  await waitForText(page, ".pricing-options-section > :nth-child(1) .btn--primary", 'Select');
  //TODO Please add an assertion here
await getText(page, ".pricing-options-section > :nth-child(1) .amount");
  await page.click(".pricing-options-section > :nth-child(1) .btn--primary");
  await waitForText(page, ".selected", 'Unselect');
  await page.click(".add-btn");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
  //TODO Please add an assertion here
await getText(page, ".app-page-layout .pricing-options-container > :nth-child(1) .amount");
  await page.click(".app-page-layout .pricing-options-container > :nth-child(1) .btn--primary");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Extracting_price_from_cart() {
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
}

async function validations(firstFlight, secondFlight, mySelection, priceCartPerTwoPax) {
  await page.evaluate((firstFlight, secondFlight, mySelection, priceCartPerTwoPax) => {
    const tolerance = 1.50; // Tolerance for approximate equality
    
    const firstFlightParseFloat = parseFloat(firstFlight); 
    const secondFlightParseFloat = parseFloat(secondFlight);
    const mySelectionParseFloat = parseFloat(mySelection);
    const priceCartPerTwoPaxParseFloat = parseFloat(priceCartPerTwoPax);
    
    const sumFirstAndSecondFlight = firstFlightParseFloat + secondFlightParseFloat;
    const totalForTwoTravelers = sumFirstAndSecondFlight * 2;
    
    // Check if the sum of the first and second flights is approximately equal to mySelection
    if (Math.abs(sumFirstAndSecondFlight - mySelectionParseFloat) <= tolerance) {
        console.log(
            `The sum of first flight per traveler (${firstFlightParseFloat}) ` +
            `and second flight per traveler (${secondFlightParseFloat}) ` +
            `is approximately equal to "My Selection" per traveler (${mySelectionParseFloat}).`
        );
    } else {
        throw new Error(
            `The sum of first flight per traveler (${firstFlightParseFloat}) ` +
            `and second flight per traveler (${secondFlightParseFloat}) ` +
            `is not approximately equal to "My Selection" per traveler (${mySelectionParseFloat}).`
        );
    }
    
    // Check if the total for two travelers is approximately equal to the price in the cart
    if (Math.abs(totalForTwoTravelers - priceCartPerTwoPaxParseFloat) <= tolerance) {
        console.log(
            `Price in cart is correct. The sum of ${firstFlightParseFloat} ` +
            `(price of first flight per traveler) and ${secondFlightParseFloat} ` +
            `(price of second flight per traveler) is multiplied by ` +
            `the 2 travelers of this trip, and this value is approximately the same ` +
            `as the total value in cart (${priceCartPerTwoPaxParseFloat}) for two pax of this trip.`
        );
    } else {
        throw new Error(
            `Price in cart is incorrect. The sum of ${firstFlightParseFloat} ` +
            `(price of first flight per traveler) and ${secondFlightParseFloat} ` +
            `(price of second flight per traveler) is not multiplied by ` +
            `the 2 travelers of this trip, and this value is not approximately the same ` +
            `as the total value in cart (${priceCartPerTwoPaxParseFloat}) for two pax of this trip.`
        );
    }
    
  }, firstFlight, secondFlight, mySelection, priceCartPerTwoPax);
}

async function t() {
  await validations(first_Flight, second_Flight, my_Selection, price_CartTwoPax);
}

