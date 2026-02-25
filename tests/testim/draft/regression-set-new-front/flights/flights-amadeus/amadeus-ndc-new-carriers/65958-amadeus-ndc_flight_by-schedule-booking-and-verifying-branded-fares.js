/*
 * Test Name: 65958 Amadeus NDC - Flight - By Schedule booking and verifying Branded Fares
 * Description: 
 * Status: Draft
 * Labels: Flights,Full Purchase,by schedule,Fare Rules,Amadeus NDC
 * Owner: Bruna Santos
 * Created: 2025-08-22T08:28:15Z
 * Updated: 2025-08-25T02:43:24Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('amandc@markup.ams');
  await Book_a_new_trip();
  await Add_traveler___Random_guest();
  await Search_flights_round_trip__by_schedule_('AMS', 'CDG');
  await Flight___Results___Wait_for__Select__text();
  await Filter_by_airline_using__Preferred_Airlines__filter_in_results('Air France');
  await Flight___Branded_Fares____Flight_details__results_page();
  await Flight___Branded_Fares___Pricing_Options_and__Flight_Details__Options();
  await Selecting_first_segment();
  await Filter_by_airline_using__Preferred_Airlines__filter_in_results('Air France');
  await Flight___Branded_Fares____Flight_details__results_page();
  await Flight___Branded_Fares___Pricing_Options_and__Flight_Details__Options();
  await Selecting_second_segment();
  await Flight___Fare_Rules___Flight_Details__Pricing_Page_();
  await Add_flights_from_pricing_page_to_cart__by_schedule_();
  await Pending_Booking___Wait_for_element_text();
  await Flight___Branded_Fares____Flight_details__cart_page();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await page.waitFor(10000);
  await Price_change_prompt();
  await Book_and_finalize();
  await Flights___Trip_Overview___Wait_for__Flight_details__text_display();
  await Flight___Branded_Fares____Flight_details__cart_page();
  await Trip_Cancelation___Warning_and_continue();
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

async function Search_flights_round_trip__by_schedule_(from, to) {
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

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function test() {
  await page.evaluate(() => {
    const xpath = `//label[.//p[text()='${option}']]//span[contains(@class, 'el-checkbox__input')]`;
    
    const element = document.evaluate(
      xpath,
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    
    if (element) {
      element.click();
    } else {
      console.error(`Checkbox for '${option}' not found.`);
    }
    
  });
}

async function Filter_by_airline_using__Preferred_Airlines__filter_in_results(option) {
  await page.click(".carriers-filter .material-symbols-outlined");
  await test();
}

async function Flight___Click__Flight_details_() {
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
}

async function Flight___Branded_Fares____Flight_details__results_page() {
  await Flight___Click__Flight_details_();
  await page.click(".flight-details > :nth-child(1) > :nth-child(2) .btn");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[aria-label='Flight details'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
}

async function Flight___Branded_Fares___Pricing_Options_and__Flight_Details__Options() {
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

async function Selecting_first_segment() {
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".change-flight-btn", 'Change flight');
}

async function Selecting_second_segment() {
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".app-page-layout .pricing-options-container > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Flight___Fare_Rules___Flight_Details__Pricing_Page_() {
  await waitForText(page, ".app-page-layout .pricing-options-container > :nth-child(1) .title", 'Your selection');
  await page.click("[class^='mt'], [class*=' mt']");
  await page.click("[class^='mt'], [class*=' mt']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(2) .flight-leg-details > :nth-child(1) .flight-time-date", /2/);
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.waitFor(2500);
  await page.click("[aria-label='Flight details'] [xmlns='http://www.w3.org/2000/svg']");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flights_from_pricing_page_to_cart__by_schedule_() {
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
  await page.click(".pricing-options-container > :nth-child(1) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
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

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
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

async function Flights___Trip_Overview___Wait_for__Flight_details__text_display() {
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Trip_Cancelation___Warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

