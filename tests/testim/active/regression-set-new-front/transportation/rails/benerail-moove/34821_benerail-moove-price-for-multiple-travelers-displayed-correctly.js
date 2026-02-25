/*
 * Test Name: 34821 - benerail moove, price for multiple travelers displayed correctly
 * Description: 
 * Status: Active
 * Labels: Full Purchase,NL government,Keeps failing,Benerail Moove Regression,Bene seats,Daily Transportation,Transportation,2026 plan 1,02
 * Owner: Shani Hadar
 * Created: 2024-03-10T10:22:19Z
 * Updated: 2025-12-19T03:00:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com/");
  await Login('Beny@moove.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_second_traveler___random_guest();
  await Copy_of_Search_benerail_by_place__2_days_trip_new('BEBMI', 'NLBAN');
  await click_on_proceed_after_search();
  await Copy_of_add_benerail_2_ways_from_search_results_to_cart();
  await choose_age_association();
  await Validate_total_for_2_travelers();
  await Accept_and_proceed_to_checkout();
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await old_1();
  await waitForText(page, ".success-message__title", 'Confirmation in Progress');
  await waitForText(page, ".quote-results__status", /In Progress|Finalizing/);
  await page.hover(".info-icon");
  await waitForText(page, "[role='tooltip']", 'Processed successfully, waiting for final confirmation');
  await Click_Go_to_Trip();
  await waitForText(page, "[class^='ml'], [class*=' ml']", /(Confirmed)|(Finalizing)|(In progress)/);
  await Trip_Cancelation___warning_and_continue();
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

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
  await sendSpecialCharacter(page, ".from-row [placeholder='Date']", 'Enter');
  await page.click(".to-row [placeholder='Date']");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".to-row [placeholder='Date']", returnDate);
  await sendSpecialCharacter(page, ".to-row [placeholder='Date']", 'Enter');
  await page.click(".from-row [placeholder='Date']");
}

async function Click() {
  if (true) {
    return;
  }
  const boolean_35 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_35) {
    await page.click("[aria-label='Next Month']");
  }
}

async function old() {
  if (true) {
    return;
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    await page.click(".from-row [placeholder='Date']");
  }
  if (false) {
    //TODO Please add an assertion here
await getText(page, "[x-placement='bottom-start'] .el-date-picker__header");
  }
  await Click();
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(4)");
  }
  if (false) {
    await page.click(".to-row [placeholder='Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(5)");
  }
}

async function Copy_of_Search_benerail_by_place__2_days_trip_new(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.type("[placeholder='From... Station or Location']", from);
  await page.click(".autocomplete-result");
  await page.type("[placeholder='To... Station or Location']", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-4993-151");
  await page.click("[id='el-id-4993-35'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-4993-35'] tbody > :nth-child(5) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-4993-156");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  if (false) {
    await sendSpecialCharacter(page, ".to-row [placeholder='Date']", 'Enter');
  }
  await old2();
  await old();
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Validate_price_for_outbound__2_travelers() {
  await waitForText(page, ".rail-list > :nth-child(1) .p-0", 'More Options');
  await page.hover("[aria-describedby='el-tooltip-4670']");
  await waitForText(page, ".tooltip-content > :nth-child(1) .text-gray", /^2 Adult/);
  //TODO Please add an assertion here
await getText(page, ".tooltip-content > :nth-child(1) .is-flex > :nth-child(2)");
  //TODO Please add an assertion here
await getText(page, ".tooltip-content .text--bold > :nth-child(2)");
  // Converting a 'validation-code-step' step has to be done manually at this time
  if (false) {
    await page.click(".rail-list > :nth-child(1) .ticket-bottom");
  }
  await page.waitForSelector(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", {state: "visible"});
  //TODO Please add an assertion here
await isVisible(page, ".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
}

async function Validate_price_for_outbound__2_travelers_1() {
  await waitForText(page, ".rail-list > section:nth-of-type(2) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await page.hover("[aria-describedby='el-tooltip-6147']");
  await waitForText(page, ".tooltip-content > :nth-child(1) .text-gray", /^2 Adult/);
  //TODO Please add an assertion here
await getText(page, ".tooltip-content > :nth-child(1) .is-flex > :nth-child(2)");
  //TODO Please add an assertion here
await getText(page, ".tooltip-content .text--bold > :nth-child(2)");
  // Converting a 'validation-code-step' step has to be done manually at this time
  if (false) {
    await page.click(".rail-list > :nth-child(1) .ticket-bottom");
  }
  await page.waitForSelector(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", {state: "visible"});
  //TODO Please add an assertion here
await isVisible(page, ".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Copy_of_add_benerail_2_ways_from_search_results_to_cart() {
  await Validate_price_for_outbound__2_travelers();
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".rail-list > :nth-child(1) .p-0", 'More Options');
  await Validate_price_for_outbound__2_travelers_1();
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function choose_age_association() {
  if (true) {
    return;
  }
  await page.click(".eu-rail-age-association .is-clickable");
  await page.click(".el-select__caret");
  await scrollTo(page, 0, 800);
  await page.click(".el-select-dropdown__item");
  await page.click(".field > :nth-child(4) .el-select__caret");
  await page.click("[x-placement='top-start'] span");
  await page.click(".tabs-container .no-border");
}

async function Validate_total_for_2_travelers() {
  await scrollTo(page, 0, 32);
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  // Converting a 'validation-code-step' step has to be done manually at this time
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

async function Wait_for_booking_message() {
  await page.waitForSelector("[aria-label='Booking Message']", {state: "visible"});
}

async function click_back_to_trip() {
  await page.click(".back-to-trip-btn");
}

async function Refresh_and_wait_for_Confirmed_status() {
  if (await getText(page, ".text--bold") !== "'        Finalizing      '") {
    return;
  }
  await page.waitFor(20000);
  await page.reload();
}

async function Book_and_Finalize_with_error_from_supplier() {
  if (!(await isVisible(page, "[aria-label='Booking Message']"))) {
    return;
  }
  await click_back_to_trip();
  await page.waitForSelector("[class^='ml'], [class*=' ml']", {state: "visible"});
  await page.waitFor(20000);
  await page.reload();
  await page.waitForSelector(".text--bold", {state: "visible"});
  await Refresh_and_wait_for_Confirmed_status();
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(1) .btn", 'Fare Rules');
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
}

async function old_1() {
  if (true) {
    return;
  }
  await Wait_for_booking_message();
  await Book_and_Finalize_with_error_from_supplier();
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Trip_Cancelation___warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

