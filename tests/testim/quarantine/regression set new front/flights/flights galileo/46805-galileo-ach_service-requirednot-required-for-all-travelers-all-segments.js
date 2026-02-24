/*
 * Test Name: 46805 Galileo ACH - Service Required/Not Required for all travelers, all segments
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Noam Miller
 * Created: 2024-06-13T07:56:09Z
 * Updated: 2026-01-07T07:15:01Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('achCorp@gdg.com');
  await book_a_new_trip();
  await waitForText(page, "#pane-flight > h4", 'Find flights for your trip');
  await Add_traveler___random_guest();
  await Add_second_traveler___random_guest();
  await Copy_of_Search_Flights___Round_trip_with_carrier('LON', 'AMS');
  await close_mandatory_notification();
  await Add_Ryan_Air_flights_to_trip();
  await Add_baggage___Required_for_all_travelers_segments();
  await Validate_Pricing();
  await Add_optional_service___Not_required_for_all_travelers_segments();
  await Checkout_and_complete_booking();
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

async function Copy_of_Search_Flights___Round_trip_with_carrier(From, To) {
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", From);
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", To);
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[placeholder='Depart Date']");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Add_Ryan_Air_flights_to_trip() {
  await waitForText(page, ".flight-list > :nth-child(1) .instant-purchase > :nth-child(2)", 'Instant Purchase');
  await scrollToElement(page, ".flight-list > :nth-child(2) .btn--primary");
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await waitForText(page, ".to-pay", 'To pay');
}

async function Add_baggage___Required_for_all_travelers_segments() {
  await scrollToElement(page, ".flight-baggage .is-clickable");
  await page.click(".flight-baggage .is-clickable");
  await page.waitForSelector("[id='pane-1662189'] .form-date-section > :nth-child(1) > :nth-child(1) .el-input", {state: "visible"});
  await page.click("[id='pane-1698538'] .form-date-section > :nth-child(1) > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2434-1458 > span");
  //TODO Please add an assertion here
await isVisible(page, "[id='pane-1662189'] .form-date-section > :nth-child(1) > :nth-child(2) .el-select__tags-text");
  await page.hover(".focusing");
  //TODO Please add an assertion here
await getText(page, "#el-id-7731-862 > ul > li:nth-child(1)");
  await page.click("[id='tab-1662188'] p");
  //TODO Please add an assertion here
await isVisible(page, "[id='pane-1662188'] .form-date-section > :nth-child(1) > :nth-child(1) .el-select__tags-text");
  //TODO Please add an assertion here
await isVisible(page, "[id='pane-1662188'] .form-date-section > :nth-child(1) > :nth-child(2) .el-select__tags-text");
  await page.click(".tabs-container .no-border");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.waitFor(2000);
  await scrollToElement(page, ".flight-baggage .card-title");
  //TODO Please add an assertion here
await isVisible(page, ".success-icon");
}

async function Validate_Pricing() {
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".price-breakdown-segment > :nth-child(3)", 'Price summary');
  //TODO Please add an assertion here
await isVisible(page, ".subtotal");
  if (await isVisible(page, ".amounts > :nth-child(3)")) {
    //TODO Please add an assertion here
await getText(page, ".amounts > :nth-child(4) .price-content");
  }
  // Converting a 'validation-code-step' step has to be done manually at this time
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .original-price .amount");
  if (false) {
    //TODO Please add an assertion here
await getText(page, ".amounts > :nth-child(2) .amount");
  }
  //TODO Please add an assertion here
await getText(page, ".subtotal .amount");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("#el-drawer__title > button > i");
}

async function Add_optional_service___Not_required_for_all_travelers_segments() {
  await page.click(".flight-optional-services .is-clickable");
  await page.waitForSelector("[id='pane-1662189'] > :nth-child(1) > :nth-child(1) > :nth-child(3) .counter-container", {state: "visible"});
  await page.click("[id='pane-1662189'] > :nth-child(1) > :nth-child(1) > :nth-child(5) .el-checkbox__inner");
  await scrollToElement(page, ".tabs-container .btn--primary");
  await page.click(".tabs-container .btn--primary");
  await waitForText(page, ".to-pay", 'To pay');
  await scrollToElement(page, "body > :nth-child(2) .el-checkbox__label");
  await page.click("body > :nth-child(2) .el-checkbox__label");
  //TODO Please add an assertion here
await isVisible(page, ".flight-optional-services .filled");
  await page.click(".flight-optional-services .is-clickable");
  await page.waitFor(2000);
  await scrollTo(page, 0, 980);
  //TODO Please add an assertion here
await isElementChecked(page, "[id='pane-1701148'] > :nth-child(1) > :nth-child(1) > :nth-child(5) .el-checkbox__input");
  await page.click("[id='tab-1701149'] p");
  //TODO Please add an assertion here
await isElementChecked(page, "[id='pane-1701149'] > :nth-child(1) > :nth-child(1) > :nth-child(5) .el-checkbox__input");
  await scrollToElement(page, "[id='pane-overview'] .btn--default");
  await page.click("[id='pane-overview'] .btn--default");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Checkout_and_complete_booking() {
  await page.click("[type='number']");
  await page.type("[type='number']", '123');
  await page.waitFor(1000);
  await page.click(".btn-container span");
  await waitForText(page, ".description", 'Receive notification on behalf of the traveller');
  await page.click(".is-hidden-mobile");
  await Click_Go_to_Trip();
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Finalizing');
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

