/*
 * Test Name: 56159 - Rail / Bus advisory for mixed transportation itinerary, equipment in detailed offer email
 * Description: 
 * Status: Active
 * Labels: NL government,results,Advisory,price offer,Flights,Amadeus,Regression,2026 plan 1
 * Owner: Noam Miller
 * Created: 2025-01-02T05:39:45Z
 * Updated: 2025-02-04T11:49:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('copytrip@corp.com');
  await New_Trip();
  await Add_traveler___random_guest();
  await page.click(".el-checkbox__inner");
  //TODO Please add an assertion here
await isElementChecked(page, ".el-checkbox__input");
  await Search_flights_round_trip('BUD', 'QKL');
  await Rail_Bus_advisory_validation();
  await Equipment_listed_in_offer_email__detailed_();
  await Rail_bus_advisory_in_Cart____Flight_Details();
  await Equipment_listed_in_offer_email__detailed__from_cart();
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

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
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
  await waitForText(page, ".class-input .el-select__selection span", 'Economy');
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

async function Rail_Bus_advisory_validation() {
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  await page.hover(".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .orange");
  await waitForText(page, "#el-id-527-383 > span:nth-child(1)", 'Mixed transportation');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await page.waitForSelector(".flight-details > :nth-child(1) > :nth-child(2) .ticket-details > :nth-child(1) .flight-leg-details", {state: "visible"});
  await scrollToElement(page, ".flight-details > :nth-child(1) > :nth-child(2) [class^='mb'], [class*=' mb']");
  await page.click(".flight-details > :nth-child(1) > :nth-child(2) [class^='mb'], [class*=' mb']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) .ticket-details > :nth-child(2) .flight-details-top-bar .material-symbols-outlined", 'directions_railway');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) .ticket-details > :nth-child(2) .aircraft-name", 'High speed train');
  await scrollToElement(page, ".flight-details > :nth-child(1) > :nth-child(3) [class^='mb'], [class*=' mb']");
  await page.click(".flight-details > :nth-child(1) > :nth-child(3) [class^='mb'], [class*=' mb']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) .mr-4", 'directions_railway');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) [class^='mb'], [class*=' mb']", 'Connection: Change transportation type');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) .font-weight-light", 'Change to High speed train in Frankfurt, Germany - International (FRA)');
  await scrollToElement(page, ".flight-details > :nth-child(1) > :nth-child(3) [class^='mb'], [class*=' mb']");
  await page.click(".flight-details > :nth-child(1) > :nth-child(3) [class^='mb'], [class*=' mb']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", 'directions_railway');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .ticket-details > :nth-child(1) .flight-leg-details > :nth-child(1) .material-symbols-outlined", 'directions_railway');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .font-weight-light", 'Change to Flight in Frankfurt, Germany - International (FRA)');
  await page.click("[aria-label='Flight details'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Equipment_listed_in_offer_email__detailed_() {
  await page.click(".actions .material-symbols-outlined");
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'add Share');
  await page.click(".flight-list > :nth-child(1) .add-icon");
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".radio-btns > :nth-child(2) .el-radio__label", 'Detailed');
  await page.click(".radio-btns > :nth-child(2) .el-radio__inner");
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(3) [bgcolor='#E7F1FF'] > :nth-child(2) > :nth-child(1)", 'Equipment:');
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(7) [bgcolor='#E7F1FF'] > :nth-child(2)", 'Equipment: HighSpeed Train |');
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(11) [bgcolor='#E7F1FF'] > :nth-child(2)", 'Equipment: HighSpeed Train |');
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(15) [bgcolor='#E7F1FF'] > :nth-child(2) > :nth-child(1)", 'Equipment:');
  await page.click(".el-dialog__header [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.click(".share-bar .is-clickable");
}

async function Rail_bus_advisory_in_Cart____Flight_Details() {
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".add-form-payment", 'Add payment method');
  await scrollToElement(page, ".more-details-btn");
  await page.click(".more-details-btn");
  await page.waitForSelector(".flight-details > :nth-child(1) > :nth-child(3) .ticket-details > :nth-child(1) .flight-leg-details", {state: "visible"});
  await scrollToElement(page, ".flight-details > :nth-child(1) > :nth-child(3) .connection-msg [class^='mb'], [class*=' mb']");
  await page.click(".flight-details > :nth-child(1) > :nth-child(3) .connection-msg [class^='mb'], [class*=' mb']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .connection-msg [class^='mb'], [class*=' mb']", 'Connection: Change transportation type');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .font-weight-light", 'Change to High speed train in Frankfurt, Germany - International (FRA)');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .ticket-details > :nth-child(2) .flight-details-top-bar .material-symbols-outlined", 'directions_railway');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .ticket-details > :nth-child(2) .aircraft-name", 'High speed train');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .ticket-details > :nth-child(2) .flight-leg-details > :nth-child(1) .material-symbols-outlined", 'directions_railway');
  await scrollToElement(page, ".flight-details > :nth-child(1) > :nth-child(4) .connection-msg [class^='mb'], [class*=' mb']");
  await page.click(".flight-details > :nth-child(1) > :nth-child(4) .connection-msg [class^='mb'], [class*=' mb']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(4) .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", 'directions_railway');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(4) .mr-4", 'flight');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(4) .connection-msg [class^='mb'], [class*=' mb']", 'Connection: Change transportation type');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(4) .font-weight-light", 'Change to Flight in Frankfurt, Germany - International (FRA)');
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Equipment_listed_in_offer_email__detailed__from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-8981-509 > li:nth-child(1)");
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody:nth-child(2) > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(3) > table > tbody > tr > td > span:nth-child(1)", /name/);
  await page.click(".radio-btns > :nth-child(2) .el-radio__inner");
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(3) [bgcolor='#E7F1FF'] > :nth-child(2) > :nth-child(1)", 'Equipment:');
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(7) [bgcolor='#E7F1FF'] > :nth-child(2) > :nth-child(1)", 'Equipment:');
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(11) [bgcolor='#E7F1FF'] > :nth-child(2) > :nth-child(1)", 'Equipment:');
  await waitForText(page, "[width='63%'] [align='center'] > :nth-child(1) > :nth-child(15) [bgcolor='#E7F1FF'] > :nth-child(2) > :nth-child(1)", 'Equipment:');
  await page.click(".el-dialog__header [fill='currentColor']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

