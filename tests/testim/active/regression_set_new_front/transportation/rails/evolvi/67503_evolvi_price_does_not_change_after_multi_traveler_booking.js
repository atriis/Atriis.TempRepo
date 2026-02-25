/*
 * Test Name: 67503 Evolvi - Price does not change after Multi Traveler booking
 * Description: 
 * Status: Active
 * Labels: multi pax,Regression,Rail,Evolvi,Full Purchase,price,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-09-23T01:37:49Z
 * Updated: 2025-09-23T02:11:35Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('elisabete@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_second_traveler___random_guest();
  await Add_third_traveler___Random_guest();
  await Search_Evolvi__UK_Rail__one_way('LIC', '105');
  await Close_mandatory_notification();
  await Select_first_Evolvi__UK_Rail__available_fare();
  await Add_Evolvi__UK_Rail__from_results_page_to_cart();
  await Extracting_price_before_booking();
  await Fill_out_Evolvi__UK_Rail__extras_in_cart();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Book_and_finalize();
  await Rails___Trip_Overview___Wait_for__More_details__display();
  await Extracting_price_after_booking();
  await Verify_two_numbers_are_equal_with_tolerance(beforeBooking, afterBooking, 0.39);
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

async function Add_third_traveler___Random_guest() {
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

async function Search_Evolvi__UK_Rail__one_way(from, to) {
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[aria-activedescendant='el-autocomplete-8871-item--1']", from);
  await sendSpecialCharacter(page, "#el-id-7815-174", 'Tab');
  await page.type("[aria-activedescendant='el-autocomplete-6209-item--1']", to);
  await sendSpecialCharacter(page, "#el-id-7815-175", 'Tab');
  await page.click("[placeholder='Pick-up date']");
  await page.dblclick("[id='el-id-5703-1150'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-5703-1150'] tbody > :nth-child(4) > :nth-child(5)");
  await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  //TODO Please add an assertion here
await isVisible(page, "[data-track='evolvi-search-split-ticket'] .el-checkbox__inner");
  await page.click(".btn--primary");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Evolvi___select_random_available_fare() {
  await page.evaluate(() => {
    // Select all elements with the specified classes, excluding those with the is-invisible class
    const elements = document.querySelectorAll('.app-price.is-flex.is-mobile.is-justify-content-center.price.is-clickable.el-tooltip__trigger.el-tooltip__trigger');
    
    // Check if there are any elements found
    if (elements.length > 0) {
             
        // Get the first element 
        const randomElement = elements[0];
        
        // Create a new mouse event
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        // Dispatch the event on the selected element
        randomElement.dispatchEvent(event);
        
        //randomElement.pare
    
    } else {
        console.log('No visible elements found with the specified class.');
    }
    
    
    
    
    //old:
    // Select all elements with the specified classes, excluding those with the is-invisible class
    //const elements = document.querySelectorAll('.price-cell.is-flex.is-align-items-center.is-justify-content-center:not(.is-invisible)');
    
    // Check if there are any elements found
    //if (elements.length > 0) {
        // Generate a random index based on the number of elements
    //    const randomIndex = Math.floor(Math.random() * elements.length);
         
        // Get the element at the random index
        //const randomElement = elements[randomIndex];
            
        // Create a new mouse event
        //const event = new MouseEvent('click', {
        //    bubbles: true,
        //    cancelable: true,
        //    view: window
        //});
        
        // Dispatch the event on the selected element
        //randomElement.dispatchEvent(event);
        
        //randomElement.pare
    
    //} else {
    //    console.log('No visible elements found with the specified class.');
    //}
  });
}

async function tab2() {
  await Evolvi___select_random_available_fare();
}

async function Select_first_Evolvi__UK_Rail__available_fare() {
  await waitForText(page, ".cap", 'Results');
  await tab2();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_Evolvi__UK_Rail__from_results_page_to_cart() {
  await waitForText(page, ".selected-prices-container .btn", 'Add to trip');
  await page.click(".uk-rail-results .btn");
  await Pending_booking___wait_for_element_text();
}

async function Extracting_price_before_booking() {
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
}

async function Reason_for_Non_Lowest() {
  await waitForText(page, ".uk-rail-non-lowest-reason .card-title", '* Reason for Non Lowest');
  await page.click(".uk-rail-non-lowest-reason .is-clickable");
  await waitForText(page, ".uk-rail-non-lowest-reason .card-title", 'Reason for Non Lowest');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, "#el-id-3797-83 > span", 'Need More Flexible Ticket');
  await page.click("#el-id-3797-115");
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-non-lowest-reason .material-symbols-outlined");
}

async function Fill_out_Evolvi__UK_Rail__extras_in_cart() {
  await scrollToElement(page, ".uk-rail-delivery-method .is-clickable");
  await page.click(".uk-rail-delivery-method .is-clickable");
  await waitForText(page, ".uk-rail-delivery-method .card-title", 'Delivery Method');
  await page.click(".uk-rail-delivery-method .card-title");
  await page.click(".el-radio-group > :nth-child(1) .el-radio__inner");
  await page.click(".tabs-container .no-border");
  await page.click(".uk-rail-accounts .is-clickable");
  await page.click(".el-select__caret");
  await page.click(".el-scrollbar__view > li:nth-of-type(2) span");
  await page.click(".tabs-container .no-border");
  await page.click(".uk-rail-client-reference .is-clickable");
  await page.type("#el-id-9224-2410", 'testim');
  await page.type("[id='pane-1573870'] > :nth-child(2) [type='text']", '1234');
  await page.type("#el-id-9224-2412", 'yes');
  await page.click("#el-id-8454-2460");
  await page.type("#el-id-8454-2460", 'temp');
  await page.click(".tabs-container .no-border");
  await Reason_for_Non_Lowest();
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

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Rails___Trip_Overview___Wait_for__More_details__display() {
  await waitForText(page, "[class^='pl'], [class*=' pl'] span", 'More details');
}

async function Extracting_price_after_booking() {
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
}

async function Verify_two_numbers_are_equal() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, "")); 
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = Math.abs(firstNumberParseFloat - secondNumberParseFloat) <= tolerance;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
  });
}

async function Verify_two_numbers_are_equal_with_tolerance(firstValue, secondValue, tolerance) {
  await Verify_two_numbers_are_equal();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

