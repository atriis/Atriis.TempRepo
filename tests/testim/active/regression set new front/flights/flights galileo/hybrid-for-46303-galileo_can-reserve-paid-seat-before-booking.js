/*
 * Test Name: Hybrid for 46303: Galileo - Can reserve paid seat before booking
 * Description: 
 * Status: Active
 * Labels: Galileo,BTP eBusiness,Seating,Flights,Regression,2026 plan 2
 * Owner: Noam Miller
 * Created: 2024-10-29T08:36:37Z
 * Updated: 2026-02-16T11:51:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shareQuote@btp.com');
  await book_a_new_trip();
  //TODO Please add an assertion here
await isVisible(page, ".flight-form");
  await Add_traveler___random_guest();
  await Add_second_traveler___random_guest();
  await Copy_of_Search_Flights___Round_trip_with_carrier('LHR', 'ATH', 'A3');
  await Add_flight_to_cart();
  await Add_paid_seats();
  await Checkout();
  await Flights___Trip_Overview___Wait_for__Flight_details__text_display();
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

async function Copy_of_Search_Flights___Round_trip_with_carrier(From, To, carrier) {
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", From);
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", To);
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.dblclick("[placeholder='Depart Date']");
  await page.click(".arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-7112-877'] .current .el-date-table-cell");
  await page.click("[id='el-id-7112-877'] tbody > :nth-child(5) > :nth-child(4) .el-date-table-cell");
  await page.click(".el-tabs__content");
  await page.click("[class^='pl'], [class*=' pl']");
  //TODO Please add an assertion here
await isVisible(page, ".flight-more-search-inputs");
  await page.click(".is-focused .el-select__placeholder span");
  await page.type("#el-id-5586-1222", carrier);
  await page.click("[id^='el-id']");
  //TODO Please add an assertion here
await isVisible(page, ".el-tag__close");
  await page.click(".search-btn");
  await waitForText(page, ".flight-list > :nth-child(1) .per-traveler", 'Per traveler');
}

async function Add_flight_to_cart() {
  await scrollToElement(page, ".flight-list > :nth-child(1) .btn--primary");
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".to-pay", 'To pay');
}

async function Select_available_flight_seat(element) {
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

async function Add_paid_seats() {
  await scrollToElement(page, ".flight-seating .is-clickable");
  await page.click(".flight-seating .is-clickable");
  await waitForText(page, "[id='pane-0'] .pax-seat-container > :nth-child(1) .btn", 'Add Seats');
  await page.click("[id='pane-0'] .pax-seat-container > :nth-child(1) .btn");
  //TODO Please add an assertion here
await isVisible(page, ".deck-wrapper > div:nth-of-type(1)");
  await Select_available_flight_seat();
  await waitForText(page, ".passengers-list > :nth-child(1) .user-selected-seat", /£/);
  await Select_available_flight_seat();
  await waitForText(page, ".selected-pax .user-selected-seat", /£/);
  await page.click(".btns-wrapper > :nth-child(2)");
  //TODO Please add an assertion here
await isVisible(page, ".el-notification__title");
  await scrollToElement(page, ".flight-seating .card-title");
  //TODO Please add an assertion here
await isVisible(page, ".flight-seating .extra__description");
}

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function Checkout() {
  await page.click(".el-checkbox__inner");
  await page.click(".quote-card .btn--default");
  await page.waitFor(60000);
  await Price_change_prompt();
  await page.waitForSelector(".pnr-code", {state: "visible"});
}

async function Flights___Trip_Overview___Wait_for__Flight_details__text_display() {
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

