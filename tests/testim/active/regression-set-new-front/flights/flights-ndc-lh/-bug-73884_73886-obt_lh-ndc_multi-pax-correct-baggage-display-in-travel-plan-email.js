/*
 * Test Name: *** BUG 73884 *** 73886: OBT - LH NDC - Multi pax, Correct baggage display in travel plan email
 * Description: 
 * Status: Active
 * Labels: Amsalem,Lufthansa NDC Regression,multi pax,baggage,Email
 * Owner: Noam Miller
 * Created: 2026-02-15T02:55:47Z
 * Updated: 2026-02-15T03:40:39Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('lhNdcpax@corp.ams');
  await Book_a_new_trip();
  await Add_traveler___Random_guest__2026();
  await Add_second_traveler___Random_guest__2026();
  await Add_third_traveler___Random_guest__2026();
  await Search_flights_round_trip('LHR', 'VIE');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Add_to_trip_first_flight();
  await Select_paid_baggage_for_2nd_pax();
  await Validate_baggage_in_email();
  await Accept__Terms___Conditions_();
  await Hold_flight();
  await Validate_baggage_in_email_1();
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

async function Add_traveler___Random_guest__2026() {
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

async function Add_second_traveler___Random_guest__2026() {
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

async function Add_third_traveler___Random_guest__2026() {
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

async function Add_to_trip_first_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Select_paid_baggage_for_2nd_pax() {
  await scrollTo(page, 0, 479);
  await page.click(".flight-baggage .is-clickable");
  await page.click("[id='tab-1898612'] p");
  await page.click("[id='pane-1898612'] .form-date-section > :nth-child(1) > :nth-child(1) .field span");
  await page.click("#el-id-1882-1173 > span");
  await page.click("[id='pane-1898612'] .el-select__placeholder span");
  await page.click("#el-id-1882-1177 > span");
  await page.click("[id='pane-overview'] .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".flight-baggage .filled");
}

async function Validate_baggage_in_email() {
  await scrollToElement(page, "#el-id-1882-1127 > li:nth-child(2)");
  await page.click("#el-id-1882-1127 > li:nth-child(2)");
  await waitForText(page, "[align='right'] .em_grey_txt > :nth-child(2)", 'LH NDC AIGB');
  await scrollTo(page, 0, 500);
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td:nth-child(6)", '1PC');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td:nth-child(6)", '1PC, ADDITIONAL BAGGAGE');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(4) > td:nth-child(6)", '1PC');
  await scrollTo(page, 0, 978);
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td:nth-child(6)", '1PC');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td:nth-child(6)", '1PC, ADDITIONAL BAGGAGE');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(4) > td:nth-child(6)", '1PC');
  await page.click(".el-dialog__header [xmlns='http://www.w3.org/2000/svg']");
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

async function Validate_baggage_in_email_1() {
  await scrollToElement(page, "#el-id-1882-1127 > li:nth-child(2)");
  await page.click("#el-id-1882-1127 > li:nth-child(2)");
  await waitForText(page, "[align='right'] .em_grey_txt > :nth-child(2)", 'LH NDC AIGB');
  await scrollTo(page, 0, 500);
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td:nth-child(6)", '1PC');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td:nth-child(6)", '1PC, ADDITIONAL BAGGAGE');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(4) > td:nth-child(6)", '1PC');
  await scrollTo(page, 0, 978);
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td:nth-child(6)", '1PC');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td:nth-child(6)", '1PC, ADDITIONAL BAGGAGE');
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(4) > td:nth-child(6)", '1PC');
  await page.click(".el-dialog__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

