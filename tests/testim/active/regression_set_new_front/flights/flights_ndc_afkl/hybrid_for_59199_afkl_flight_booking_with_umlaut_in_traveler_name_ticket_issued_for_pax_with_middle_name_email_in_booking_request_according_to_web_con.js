/*
 * Test Name: Hybrid for 59199 AFKL - Flight Booking with Umlaut in Traveler Name, ticket issued for pax with middle name, email in booking request according to web confirmation settings
 * Description: 
 * Status: Active
 * Labels: Amsalem,AFKL NDC Regression,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-03-10T01:52:42Z
 * Updated: 2026-01-20T01:00:15Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ndc@testim.com');
  await New_Trip();
  await add_traveler_by_name('Sönja Götz');
  await Copy_of_Add_second_traveller___random_guest_with_middle_name();
  await Search_flight_and_Add_to_trip();
  await Accept_and_proceed_to_checkout();
  await Finalize_Booking();
  await page.waitFor(10000);
  await Refresh_tab();
  await Validate_ticket_numbers();
  await Trip_Cancelation();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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
  await waitForText(page, ".el-checkbox__label", 'Allow nearby airports');
}

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Copy_of_Generate_random_first_and_last_name() {
  await page.evaluate(() => {
    //Arrays containing first names and last names
    
    const firstNames = [
    
      "Christian",
      "Benjamin",
      "Tobias",
      "Daniel",
      "Stefan ",
      "Alexander",
      "Florian",
      "Matthias",
      "Tomas",
      "Andreas",
      "Oliver",
      "Dominic ",
      "Lukas",
      "Bastian",
      "Erik",
      "Roman",
      "Adrian",
      "Julius",
      "Damian",
      "Elias"
      // Add more first names here
    
    ];
    
    const lastNames = [
    
      "Baasch",
      "Adelman",
      "Drossel",
      "Lobinger",
      "Lammert",
      "Lahmann",
      "Liepert",
      "Kemmler",
      "Kloss",
      "Weidmann",
      "Wechsler",
      "Ferstl",
      "Ostermeyer",
      "Norden",
      "Hegemann",
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

async function Copy_of_Add_second_traveller___random_guest_with_middle_name() {
  await page.waitForSelector("[aria-describedby^='el-tooltip']", {state: "visible"});
  await page.waitFor(1000);
  await page.click("[aria-describedby^='el-tooltip']");
  await page.waitFor(1000);
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-1-220 > span");
  await Copy_of_Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  await page.click("#el-id-9138-94");
  await page.type("#el-id-9138-94", 'Jonas');
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
  await page.waitForSelector(".travelers-list > :nth-child(2) .is-clickable", {state: "visible"});
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

async function Search_flight_in_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Search_flight_and_Add_to_trip() {
  await Search_flights_round_trip('DUS', 'CDG');
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  await Search_flight_in_results_page('AF');
  await scrollToElement(page, ".flight-list > :nth-child(1) .btn--primary");
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".to-pay", 'To pay');
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Finalize_Booking() {
  await waitForText(page, "h1", 'Booking details');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".app-label--quote", /(Ticketing Complete)|(Finalizing)/);
}

async function Refresh_tab() {
  await page.reload();
}

async function Validate_ticket_numbers() {
  await scrollToElement(page, ".more-details-btn");
  await page.click(".more-details-btn");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) thead tr > :nth-child(2)", 'Ticket number');
  //TODO Please add an assertion here
await getText(page, ".flight-details > :nth-child(1) > :nth-child(2) tbody > :nth-child(1) > td:nth-of-type(2) [class^='mr'], [class*=' mr']");
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

