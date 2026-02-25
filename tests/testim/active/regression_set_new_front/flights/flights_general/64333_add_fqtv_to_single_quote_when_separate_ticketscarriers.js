/*
 * Test Name: 64333 - Add FQTV to single quote when separate tickets/carriers
 * Description: 
 * Status: Active
 * Labels: FQTV,Club,separate tickets,Flights,Regression,Sabre,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-07-09T06:05:27Z
 * Updated: 2025-07-15T08:26:27Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('multifqtv@corp.club');
  await Book_a_new_trip();
  await Add_traveler___Random_guest();
  await Search_flights_round_trip_by_schedule('ATL', 'EWR');
  await Copy_of_Select_flights_from_results__by_schedule_search_();
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Validate_save_FQTV();
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

async function Book_a_new_trip() {
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

async function Add_traveler___Random_guest() {
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

async function Search_flights_round_trip_by_schedule(from, to) {
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

async function Copy_of_Select_flights_from_results__by_schedule_search_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click("#el-id-2736-1357");
  await page.type("#el-id-2736-1357", 'DL');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click("#el-id-2736-1357");
  await page.type("#el-id-2736-1357", 'UA');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
  await waitForText(page, ".pricing-options-container > :nth-child(1) .more-info div > :nth-child(1) > :nth-child(2)", 'Separated Tickets');
  await page.click(".pricing-options-container > :nth-child(1) .btn--primary");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Validate_save_FQTV() {
  await scrollToElement(page, ".flight-frequent-flyer .is-clickable");
  await page.click(".flight-frequent-flyer .is-clickable");
  await waitForText(page, "[id='el-id-7016-2731'] > :nth-child(2) .el-radio__label", 'New');
  await page.click("#el-id-7016-2729");
  await page.type("#el-id-7016-2729", '990099009900');
  await sendSpecialCharacter(page, "#el-id-7016-2729", 'Tab');
  await page.type("#el-id-7016-2730", 'Delta');
  await sendSpecialCharacter(page, "#el-id-7016-2730", 'Enter');
  await page.click("#el-id-7016-2732");
  await page.type("#el-id-7016-2732", 'FQTV123');
  await sendSpecialCharacter(page, "#el-id-7016-2732", 'Tab');
  await page.type("#el-id-7016-2733", 'United');
  await sendSpecialCharacter(page, "#el-id-7016-2733", 'Enter');
  await page.click(".tabs-container .btn--primary");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

