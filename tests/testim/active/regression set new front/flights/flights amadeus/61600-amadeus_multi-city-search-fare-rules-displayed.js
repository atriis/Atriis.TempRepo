/*
 * Test Name: 61600 Amadeus - Multi city search, fare rules displayed
 * Description: 
 * Status: Active
 * Labels: uniglobe,Amadeus,Fare Rules,Regression,Flights,Pricing Options,multi city,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-05-05T11:12:12Z
 * Updated: 2025-10-16T11:34:30Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await Book_a_new_trip();
  await Add_traveller___random_guest();
  await Search_flights___Multi_city();
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Fare_rules_in_results();
  await Fare_rules_in_pricing_options();
  await Add_to_trip();
  await Fare_rules_in_cart();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollOnElement(page, selector, x, y) {
  await page.evaluate(([selector, x, y]) => {
    const element = document.querySelector(selector);
    element.scroll(x, y);
  }, [selector, x, y]);
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

async function Search_flights___Multi_city() {
  await page.click("[id='el-id-9936-76'] > :nth-child(3) .el-radio__label");
  await waitForText(page, ".add-flight-btn", 'add  Add another flight');
  await page.click("#el-id-9936-289");
  await page.type("#el-id-9936-289", 'BRU');
  await page.click("[id='el-id-9936-277-item-0'] .has-text-weight-bold");
  await page.click("#el-id-9936-290");
  await page.type("#el-id-9936-290", 'LHR');
  await page.click("[id='el-popper-container-9936'] .has-text-weight-bold");
  await page.click("#el-id-9936-291");
  await page.click("[id='el-id-9936-282'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9936-282'] tbody > :nth-child(4) > td:nth-of-type(6) .el-date-table-cell__text");
  await page.click(".add-flight-btn");
  await page.click("#el-id-9936-307");
  await page.type("#el-id-9936-307", 'CLT');
  await page.click("[id='el-popper-container-9936'] .has-text-weight-bold");
  await page.click("#el-id-9936-308");
  await page.click("[id='el-id-9936-299'] tbody > :nth-child(4) > td:nth-of-type(6) .el-date-table-cell__text");
  await page.click(".add-flight-btn");
  await page.click("#el-id-9936-324");
  await page.type("#el-id-9936-324", 'BRU');
  await page.click("[id='el-id-9936-314-item-0'] .ellipsis");
  await page.click("#el-id-9936-325");
  await page.click("[id='el-id-9936-316'] tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await scrollToElement(page, ".btn--primary");
  await page.click(".btn--primary");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Fare_rules_in_results() {
  await scrollToElement(page, ".flight-list > :nth-child(2) .fare-rules-btn");
  await page.click(".flight-list > :nth-child(2) .fare-rules-btn");
  await waitForText(page, ".el-select span", 'Jump to...');
  //TODO Please add an assertion here
await isVisible(page, ".main-content > :nth-child(3) .rule-headline");
  await waitForText(page, ".main-content > :nth-child(1) .rule-headline", 'Minimum Stay');
  await page.click("#tab-1");
  //TODO Please add an assertion here
await isVisible(page, ".main-content > :nth-child(2) .rule-headline");
  await page.click("#tab-2");
  //TODO Please add an assertion here
await isVisible(page, ".main-content > :nth-child(3) .rule-headline");
  await page.click("[aria-label='Fare rules'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Fare_rules_in_pricing_options() {
  await page.click(".flight-list > :nth-child(2) .btn--default");
  await waitForText(page, ".options-header h4", 'Economy pricing');
  await scrollOnElement(page, "#el-id-8732-642", 0, 177);
  await page.click(".pricing-options-section > :nth-child(1) .link-style");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-1027-627 > section > div > div.mb-4");
  //TODO Please add an assertion here
await isVisible(page, ".main-content > :nth-child(3) .rule-headline");
  await page.click("[aria-label='Fare rules'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.click(".flicking-camera > :nth-child(1) .btn--primary");
  await page.click(".pricing-options-section > :nth-child(2) .link-style");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-1027-627 > section > div > div.mb-4");
  //TODO Please add an assertion here
await isVisible(page, ".main-content > :nth-child(2) .rule-headline");
  await page.click("[aria-label='Fare rules'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".pricing-options-section > :nth-child(2) .btn--primary");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.click(".main-info-wrapper .link-style");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-1027-627 > section > div > div.mb-4");
  //TODO Please add an assertion here
await isVisible(page, ".main-content > :nth-child(3) .rule-headline");
  await page.click("#logged-in-page > div > section > section > main > section > main > section > div:nth-child(4) > div > header > button > i > svg > path");
  await page.click(".select-btn");
}

async function Add_to_trip() {
  await page.click(".add-btn");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await waitForText(page, ".to-pay", 'To pay');
}

async function Fare_rules_in_cart() {
  await scrollToElement(page, ".fare-rules-btn");
  await page.click(".fare-rules-btn");
  //TODO Please add an assertion here
await isVisible(page, "#el-id-1027-899 > section > div > div.mb-4");
  //TODO Please add an assertion here
await isVisible(page, ".main-content > :nth-child(3) .rule-headline");
}

