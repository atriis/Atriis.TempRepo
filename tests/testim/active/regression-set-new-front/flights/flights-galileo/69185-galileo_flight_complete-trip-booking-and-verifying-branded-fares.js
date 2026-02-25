/*
 * Test Name: 69185 Galileo - Flight - Complete Trip booking and verifying Branded Fares
 * Description: 
 * Status: Active
 * Labels: Flights,Branded fares,Full Purchase,Regression,Galileo,GDS,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-10-22T03:09:08Z
 * Updated: 2025-11-03T08:04:24Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("bsgalileoflight@galileoflight.com");
  await Book_a_new_trip();
  await Add_traveler___Random_guest();
  await Search_flights_one_way('AMS', 'DOH');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Check_flight_branded_fares___flight_details__results_page_();
  await Check_flight_branded_fares___pricing_options__results_page_();
  await Add_to_trip_first_flight();
  await Pending_booking___wait_for_element_text();
  await Flight___Branded_Fares____Flight_details__cart_page();
  await Accept__Terms___Conditions_();
  await Hold_flight();
  await Flight___Branded_Fares____Flight_details__cart_page();
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

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Flight___Click__Flight_details_() {
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
}

async function Check_flight_branded_fares___flight_details__results_page_() {
  await Flight___Click__Flight_details_();
  await page.click(".flight-details > :nth-child(1) > :nth-child(2) .btn");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[aria-label='Flight details'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
}

async function Check_flight_branded_fares___pricing_options__results_page_() {
  await page.click(".flight-list > :nth-child(1) .pricing-options");
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.click(".segment-preview .btn");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click(".segment-preview .btn");
  await waitForText(page, ".segment-preview .btn", 'Flight details');
  await page.click(".pricing-options-section > :nth-child(1) .brand-name");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitFor(2500);
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_first_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Flight___Branded_Fares____Flight_details__cart_page() {
  await waitForText(page, ".more-details-btn", 'Flight details');
  await page.click(".more-details-btn");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .flight-leg-details > :nth-child(1) .flight-time-date", /2/);
  await page.click(".flight-details > :nth-child(1) > :nth-child(3) .btn");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".flight-quote-card > :nth-child(4)");
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Price_Change() {
  if (await getText(page, ".muliBold") !== "'Price change'") {
    return;
  }
  await page.click(".app-footer .is-flex-wrap-wrap .btn--primary");
}

async function On() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Hold_flight() {
  await page.click(".quote-card .btn--default");
  await Price_Change();
  await On();
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

