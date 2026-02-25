/*
 * Test Name: Hybrid for 61699: Ypsilon - Correct cabin displayed after booking, Correct cabin code sent when creating passive PNR
 * Description: 
 * Status: Active
 * Labels: Sabre,Club,Ypsilon,Passive Pnr,Regression,hybrid,Flights,Advanced search,progress page,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-05-08T07:26:55Z
 * Updated: 2026-02-10T05:08:29Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('ypsilonCorp@club.com');
  await New_Trip();
  await Add_traveller___random_guest();
  await Search_flights__round_trip_with_carrier();
  await Add_Premium_Economy_to_cart();
  await page.click("#el-id-255-1151");
  await page.type("#el-id-255-1151", '123');
  await Accept_and_proceed_to_checkout();
  await Ypsilon_credit_card_verification();
  await Validate_cabin_after_booking();
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function New_Trip() {
  await book_a_new_trip();
  await waitForText(page, ".el-checkbox__label", 'Allow nearby airports');
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

async function Search_flights__round_trip_with_carrier() {
  await page.click(".el-tabs__header p");
  await page.click("[class^='mt'], [class*=' mt']");
  await waitForText(page, ".is-transparent span", 'Up to 3 preferred airlines');
  await page.click("#el-id-6407-929");
  await page.type("#el-id-6407-929", 'DUB');
  await page.click("[id='el-id-7984-348-item-0'] .has-text-weight-bold");
  await page.click("#el-id-6407-934");
  await page.type("#el-id-6407-934", 'PAR');
  await page.click("[id='el-id-2411-371-item-0'] .has-text-weight-bold");
  await page.click("#el-id-6407-930");
  await page.click("[id='el-id-6407-350'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-6407-350'] tbody > :nth-child(5) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-6407-935");
  await page.click("[id='el-id-6407-373'] tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".is-transparent span");
  await page.type("#el-id-6407-940", 'Aer Lingus');
  await page.click("#el-id-6666-408 > span");
  await page.click(".btn--primary");
}

async function Add_Premium_Economy_to_cart() {
  await scrollToElement(page, ".flight-list > :nth-child(2) .btn--default");
  await page.click(".flight-list > :nth-child(2) .btn--default");
  await waitForText(page, ".cabin-class-header > :nth-child(2)", 'Premium');
  await page.click(".pricing-options-container [aria-selected='false'] .amount");
  await page.click(".select-btn");
  await page.click(".select-btn");
  await page.click(".add-btn");
  await waitForText(page, ".app-label--quote", 'Pending booking');
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

async function Ypsilon_credit_card_verification() {
  await waitForText(page, ".el-dialog__title", 'Card verification');
  await page.type("#password", '555');
  await page.click("#submit_accept");
  await page.waitFor(5000);
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
}

async function Validate_cabin_after_booking() {
  await page.click(".btn-container > :nth-child(1)");
  //TODO Please add an assertion here
await isVisible(page, ".app-label--quote");
  await scrollToElement(page, ".more-details-btn");
  await page.click(".more-details-btn");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) thead tr > :nth-child(1)", 'Traveler');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) .flight-advisories > :nth-child(2) p", 'Premium Economy (P)');
  await scrollOnElement(page, ".el-drawer__body", 0, 556);
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .flight-advisories > :nth-child(2) p", 'Premium Economy (P)');
}

