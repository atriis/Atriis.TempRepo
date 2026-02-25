/*
 * Test Name: 61091 Ypsilon - Multi pax, Ancillary service selection saved for all
 * Description: 
 * Status: Active
 * Labels: Ypsilon,Regression,Amsalem,baggage,ancillary,Flights,Daily Flights,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-04-21T08:04:46Z
 * Updated: 2025-11-18T07:55:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('ypsilon@corp.ams');
  await book_a_new_trip();
  await Add_traveller___random_guest();
  await Add_second_traveller___random_guest();
  await Search_flights_and_add_to_cart();
  await Add_baggage();
  await Validate_baggage_selection_was_saved_for_all_travelers();
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

async function Add_traveller___random_guest() {
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

async function Add_second_traveller___random_guest() {
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

async function Search_flights_and_add_to_cart() {
  await Search_flights_round_trip('DUB', 'AMS');
  await waitForText(page, ".flight-list > :nth-child(1) .to-pay", 'From');
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".app-label--quote", 'Pending booking');
}

async function Refresh_cart_page() {
  await page.reload();
}

async function Add_baggage() {
  await waitForText(page, ".app-label--quote", 'Pending booking');
  await scrollToElement(page, ".flight-ancillary-services .is-clickable");
  await waitForText(page, ".flight-ancillary-services .card-title", 'Ancillary Services');
  await page.click(".flight-ancillary-services .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, "#pane-1769086 > div > div");
  await page.click("[id='pane-1769198'] .form-date-section > :nth-child(1) > :nth-child(2) .el-icon");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-6061-1122");
  await page.click("#el-id-8756-1052 > span");
  await page.waitFor(500);
  await page.click(".is-reverse");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-614-1056");
  await page.click("#el-id-614-1058 > span");
  //TODO Please add an assertion here
await getText(page, "[id='pane-1769086'] .services > :nth-child(2) .field span");
  //TODO Please add an assertion here
await getText(page, "[id='pane-1769086'] .services > :nth-child(3) .field span");
  await page.click("[id='tab-1769085'] p");
  await page.click("[id='pane-1769209'] .form-date-section > :nth-child(1) > :nth-child(2) .el-icon");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-4836-1153");
  await page.click("#el-id-1538-1094");
  await page.click("[id='pane-1769209'] .form-date-section > :nth-child(1) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-4836-1159");
  await page.click("#el-id-8612-1100");
  //TODO Please add an assertion here
await getText(page, "[id='pane-1769085'] .services > :nth-child(2) .el-select__placeholder");
  //TODO Please add an assertion here
await getText(page, "[id='pane-1769085'] .services > :nth-child(3) .el-select__placeholder");
  await page.click(".tabs-container .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".el-notification p");
  await waitForText(page, ".to-pay", 'To pay');
  await Refresh_cart_page();
}

async function Validate_baggage_selection_was_saved_for_all_travelers() {
  await scrollToElement(page, ".flight-ancillary-services .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, ".flight-ancillary-services .filled");
  await page.click(".flight-ancillary-services .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, "#pane-1769086 > div > div");
  await waitForText(page, "[id='pane-1769086'] .services > :nth-child(2) .field span", pax1OutBag);
  await waitForText(page, "[id='pane-1769086'] .services > :nth-child(3) .field span", pax1InBag);
  await page.click("[id='tab-1769085'] p");
  await waitForText(page, "[id='pane-1769085'] .services > :nth-child(2) .field span", pax2OutBag);
  await waitForText(page, "[id='pane-1769085'] .services > :nth-child(3) .field span", pax2InBag);
}

