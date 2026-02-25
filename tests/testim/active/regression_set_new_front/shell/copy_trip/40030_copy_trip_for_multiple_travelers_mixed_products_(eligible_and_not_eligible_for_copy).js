/*
 * Test Name: 40030 Copy trip for multiple travelers, mixed products (eligible and not eligible for copy)
 * Description: 
 * Status: Active
 * Labels: Flights,Copy Trip,Adding Passengers,Amadeus,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
 * Owner: Noam Miller
 * Created: 2023-12-07T01:31:02Z
 * Updated: 2026-02-16T01:58:54Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('copytrip@corp.com');
  await Book_a_new_trip();
  await Add_traveler___random_guest();
  await Add_second_traveler___random_guest();
  await Search_flights_round_trip('BOS', 'LHR');
  await waitForText(page, ".carriers-filter h4", 'Preferred airlines');
  //TODO Please add an assertion here
await isVisible(page, ".flight-list > :nth-child(1) .ticket-top-section");
  await Add_to_trip_flight();
  await Flight_quote_info_variables();
  await Add_EU_Rail();
  await Copy_trip();
  await Validate_copied_trip_info();
  await Cancel_copied_trip();
  await close_tab___choose_relevant_tab_in_context();
  await waitForText(page, ".flight-quote-card .has-text-weight-bold", 'Pending booking');
  await Cancel_original_trip();
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

async function Book_a_new_trip() {
  await book_a_new_trip();
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
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

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Flight_quote_info_variables() {
  //TODO Please add an assertion here
await getText(page, ".not-last-segment");
  //TODO Please add an assertion here
await getText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .flight-info");
}

async function Add_EU_Rail() {
  await page.hover("[class^='py'], [class*=' py']");
  await page.click("[x-placement='bottom-end'] span");
  await page.click("[role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.click("[placeholder='From... Station or Location']");
  await page.type("[placeholder='From... Station or Location']", 'bebmi');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='To... Station or Location']");
  await page.type("[placeholder='To... Station or Location']", 'nlaho');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Departure']");
  await page.click("[aria-label='Next Month']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(6) span");
  await page.click(".search-btn");
  await waitForText(page, ".rail-list > section:nth-of-type(1) .p-0", 'More Options');
  await page.click(".rail-list > section:nth-of-type(2) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await waitForText(page, ".product-extra-info > :nth-child(1) > :nth-child(1)", 'To pay');
}

async function Copy_trip() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#el-id-3696-1113 > li:nth-child(2)");
  await waitForText(page, ".cancel-trip-modal > div:nth-of-type(1) p", 'The following items will be copied to a new trip');
  await waitForText(page, ".quote-details-container > :nth-child(2)", /This item can not be copied/);
  await page.click("[aria-label='Copy trip'] .btn--primary");
}

async function Validate_copied_trip_info() {
  await waitForText(page, ".to-pay", 'To pay');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  //TODO Please add an assertion here
await isVisible(page, "[aria-describedby='el-tooltip-3730']");
  await waitForText(page, ".not-last-segment", departInfo);
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(2) .flight-info", returnInfo);
  await scrollTo(page, 0, 1002);
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function Cancel_copied_trip() {
  await Trip_Cancelation();
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function close_tab___choose_relevant_tab_in_context() {
  await close_tab();
}

async function Cancel_original_trip() {
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.hover("[id^='el-id']");
  await page.click("#el-id-8274-1689 > li:nth-child(3)");
  await waitForText(page, "#el-id-8274-1706 > div > section > div.mb-4 > p", 'You are about to cancel all items in your trip.');
  await page.click("[aria-label='Trip cancellation'] .btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

