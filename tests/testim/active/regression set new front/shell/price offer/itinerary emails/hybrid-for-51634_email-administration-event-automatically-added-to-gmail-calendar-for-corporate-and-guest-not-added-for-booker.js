/*
 * Test Name: Hybrid for 51634 - Email administration, Event automatically added to Gmail calendar for corporate and guest, not added for booker
 * Description: 
 * Status: Active
 * Labels: Email,Administration,outlook calendar,hybrid,Regression,UK Parking,Ypsilon,Flights,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-04-17T11:10:21Z
 * Updated: 2025-09-17T12:20:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://localhost:44324/");
  await Login('gmail@booker.com');
  await click_on_administration();
  await Validate_Gmail();
  await close_tab___choose_relevant_tab_in_context();
  await book_a_new_trip();
  await Add_traveler_by_name('Grace Calivent');
  await Add_second_traveller___random_guest();
  await Search_flights_one_way('LON', 'BCN');
  await waitForText(page, ".flight-list > :nth-child(1) .instant-purchase > :nth-child(2)", 'Instant Purchase');
  await Add_to_trip_first_flight();
  await page.click(".flicking-camera > :nth-child(5) .icon-text");
  await waitForText(page, ".btn--size-large", 'Search');
  await page.type("[name='false']", 'LHR');
  await page.click(".autocomplete-result");
  await page.click("#el-id-3635-1078");
  await page.click("[id='el-id-3635-1039'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3635-1039'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--size-large");
  await waitForText(page, ".parking-list > :nth-child(1) .btn--primary", 'Add to trip');
  await page.click("[id='el-id-9333-1177'] > :nth-child(2) .el-checkbox__inner");
  await page.click(".parking-list > :nth-child(2) .btn--primary");
  await Pending_booking___wait_for_element_text();
  await set_CVV_in_cart_if_needed();
  await UK_Parking_Trip_overview('31289218', 'car', 'idk', '23423', 'black', '1245', '4', 'U2344', '7');
  await page.click(".flight-quote-card .el-checkbox__inner");
  await Accept_and_proceed_to_checkout();
  await If_credit_card_verification___Ypsilon();
  await waitForText(page, ".app-label--quote", 'Ticketing Complete');
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


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function click_on_administration() {
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
}

async function List_length__with_locator_as_parameter_(length, locator) {
  await page.evaluate((length, locator) => {
    const expectedLength = Number(length); // Replace 'length' with the expected number of visible elements
    
    // Convert NodeList to an array, ensure exact matches, and filter for visible elements
    const elements = Array.from(document.querySelectorAll(locator))
      .filter(el => el.matches(locator)) // Ensure the element exactly matches the locator
      .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)); // Robust visibility check
    
    // Validate the number of visible and exact match elements
    if (elements.length === expectedLength) {
      console.log(`The element appears ${elements.length} times and is visible.`);
    } else {
      throw new Error(`Assertion failed: Expected ${expectedLength} visible elements, but found ${elements.length}.`);
    }
    
  }, length, locator);
}

async function Validate_Gmail() {
  await waitForText(page, "[name='settingsForm'] > :nth-child(4) > :nth-child(1) div", 'Corporate main email provider:');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click("[id='s2id_autogen11'] b");
  //TODO Please add an assertion here
await isVisible(page, "[id='select2-drop'] [class$='results'], [class*='results '] > li:nth-of-type(2) [class$='result-label'], [class*='result-label ']");
  await List_length__with_locator_as_parameter_('3', '.select2-results-dept-0');
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function Add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
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

async function Add_second_traveller___random_guest() {
  await page.waitForSelector("[aria-describedby^='el-tooltip']", {state: "visible"});
  await page.waitFor(1000);
  await page.click("[aria-describedby^='el-tooltip']");
  await page.waitFor(1000);
  await page.click(".traveler-name");
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
  await page.type("[placeholder='Enter email address']", 'jeemayleeucer@gmail.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-1-240 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".travelers-list > :nth-child(2) .is-clickable", {state: "visible"});
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

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
}

async function UK_Parking_Trip_overview(mobilenumber, car, model, carregistration, colour, flightnumber, terminal, returnflight, returnterminal) {
  await waitForText(page, ".contact-information .card-title", /Contact Information/);
  await waitForText(page, ".delivery-pickup .card-title", /Delivery/);
  await page.click(".contact-information .is-clickable");
  await page.click("[type='number']");
  await page.type("[type='number']", mobilenumber);
  await page.click(".tabs-container .no-border");
  await page.type("[placeholder='Volkswagen']", car);
  await page.type("[placeholder='Golf']", model);
  await page.type("[placeholder='BD51 SMR']", carregistration);
  await page.type("[placeholder='Silver']", colour);
  await page.click(".tabs-container .no-border");
  await page.click(".delivery-pickup .is-clickable");
  await page.type(".inputs > div:nth-of-type(2) [type='text']", flightnumber);
  await page.type(".inputs > div:nth-of-type(3) [type='text']", terminal);
  await page.type(".inputs > div:nth-of-type(4) [type='text']", returnflight);
  await page.type(".inputs > div:nth-of-type(5) [type='text']", returnterminal);
  await page.click(".tabs-container .no-border");
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

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function If_credit_card_verification___Ypsilon() {
  await Ypsilon_credit_card_verification();
  await Click_Go_to_Trip();
}

