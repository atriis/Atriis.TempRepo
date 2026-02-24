/*
 * Test Name: 38628 MERGED Amadeus oop for baggage amount with no baggage included + can see CO2 emissions data + CO2 values appear even if in the administration they are inherited from the agency + contact info appears for a corporate user
 * Description: 
 * Status: Active
 * Labels: Flights,Amadeus,Travel policy,NL government,baggage,OOP,Full Purchase,Regression,contact info,CO2,No Amadeus Hotel Book,progress page,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-20T11:18:46Z
 * Updated: 2025-11-11T08:36:15Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('lary bagto');
  await Search_flights_round_trip___dates_in_2_months('TLV', 'BUD');
  await click_on_proceed_after_search();
  await Flight___Results___Wait_for__Add_to_trip__text();
  await validate_CO2();
  await Filter_by_any_option_in_results_page('EL AL');
  await Add_flight_from_results_page_to_cart();
  await validate_there_is_no_oop_indication();
  await validate_CO2_in_cart();
  await add_1_bag_and_validate_there_is_no_oop();
  await add_second_bagage_and_validate_oop();
  await validate_justification();
  await Accept_and_proceed_to_checkout();
  await Price_change_prompt();
  await waitForText(page, ".contact-details-container [class^='is-size'], [class*=' is-size']", 'Contact details');
  await validate_contact_details();
  await Book_and_finalize_with_contact_details();
  await waitForText(page, ".out-of-policy-badge", 'Out of policy');
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

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
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

async function Search_flights_round_trip___dates_in_2_months(from, to) {
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
  await page.click("[data-popper-placement='top'] .arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[data-popper-placement='top'] .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await old_date_picker();
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

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function validate_CO2() {
  await waitForText(page, ".flight-list > :nth-child(1) .is-size-7", /^[0-9]/);
  await waitForText(page, ".flight-list > :nth-child(1) .carbon > :nth-child(2)", 'Kg');
  await waitForText(page, ".flight-list > :nth-child(1) .carbon > :nth-child(3)", 'CO2');
  await page.click(".flight-list > :nth-child(1) .is-size-5");
  if (false) {
    await page.hover(".flight-list > :nth-child(1) .is-size-5");
  }
  await waitForText(page, "h6 .is-lowercase", 'Emissions');
  await waitForText(page, ".tooltip-content > :nth-child(2) > :nth-child(1)", 'This flight');
  await waitForText(page, ".tooltip-content > :nth-child(2) .muliSemiBold", /^[0-9]/);
  await waitForText(page, ".tooltip-content > :nth-child(2) .muliSemiBold", /kg CO2/);
  await waitForText(page, ".tooltip-content > :nth-child(3) > :nth-child(1)", 'Typical for this route');
  await waitForText(page, ".tooltip-content > :nth-child(3) .muliSemiBold", /^[0-9]/);
  await waitForText(page, ".tooltip-content > :nth-child(3) .muliSemiBold", /kg CO2/);
  await page.click("[class$='emissions-tooltip'], [class*='emissions-tooltip '] .material-symbols-outlined");
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

async function Filter_by_any_option_in_results_page(option) {
  await page.click(".carriers-filter .material-symbols-outlined");
  await test();
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function validate_there_is_no_oop_indication() {
  await waitForText(page, ".text--bold", 'Pending booking');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function validate_CO2_in_cart() {
  await waitForText(page, "[class^='is-size'], [class*=' is-size']", /^[0-9]/);
  await waitForText(page, ".carbon > :nth-child(2)", 'Kg');
  await waitForText(page, ".carbon > :nth-child(3)", 'CO2');
}

async function add_1_bag_and_validate_there_is_no_oop() {
  await page.click(".flight-baggage .is-clickable");
  await page.click(".form-date-section > :nth-child(1) > :nth-child(1) .el-select__caret");
  await waitForText(page, "#el-id-5344-1380 > span", /CHECKED BAG 1st/);
  await page.click("#el-id-9046-1311 > span");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click(".is-flex-direction-row");
  await page.click(".tabs-container .no-border");
  await waitForText(page, ".el-notification__title", 'Success');
  await waitForText(page, ".more-details-btn", 'Flight details');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function add_second_bagage_and_validate_oop() {
  await scrollToElement(page, ".flight-baggage .is-clickable");
  await page.click(".flight-baggage .is-clickable");
  await page.click(".form-date-section > :nth-child(1) > :nth-child(1) .el-select__suffix [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".is-selected span", /CHECKED BAG 1st/);
  await page.click("#el-id-9046-1355 > span");
  await scrollTo(page, 0, 500);
  await waitForText(page, ".out-of-policy-badge", 'Out of policy');
  await page.hover("[aria-describedby='el-tooltip-406']");
  await waitForText(page, "#el-id-9046-1369 > ul > li", 'Luggage Amount is greater than or equals 2');
  await page.click(".is-flex-direction-row");
  await page.click(".tabs-container .no-border");
  await waitForText(page, ".el-notification__title", 'Success');
  await waitForText(page, ".out-of-policy-badge", 'Out of policy');
  await page.hover(".info-icon");
  await waitForText(page, "#el-tooltip-5493 > ul > li", 'Luggage Amount is greater than or equals 2');
}

async function validate_justification() {
  await waitForText(page, ".oop-title", 'Out of policy');
  await waitForText(page, ".out-of-policy-label", 'Luggage Amount is greater than or equals 2');
  await page.click(".el-select__caret");
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(1) span", 'No train available to destination');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(2) span", 'Train not an option for same day return');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(3) span", 'Train option only possible with adjusted travel program');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(4) span", 'Significantly lower CO2 emissions with this direct flight');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(5) span", 'Cheaper ticket only possible with adjusted travel program');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(6) span", 'Travel program still not definite. Flexibility needed.');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(7) span", 'Indirect flight only with possible with very short transfer time.');
  await page.click(".el-scrollbar__view > li:nth-of-type(1) span");
  await page.waitFor(500);
  await page.click("[class^='px'], [class*=' px'] .btn");
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

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function validate_booker_s_phone_number() {
  await waitForText(page, ".fs14", /booker phone number/);
  await waitForText(page, "#el-id-8123-1455", '975');
  await waitForText(page, "#el-id-8123-1456", '2');
  await waitForText(page, "#el-id-8123-1457", '514545');
}

async function validate_traveler_s_phone_number() {
  await waitForText(page, "[id='el-collapse-content-1452'] .is-justify-content-space-between .label", 'Traveller Phone');
  await waitForText(page, "#el-id-8123-1458", '972');
  await waitForText(page, "#el-id-8123-1459", '54');
  await waitForText(page, "#el-id-8123-1460", '2563891');
}

async function validate_traveler_s_email() {
  await waitForText(page, ".contact-details-container .app-columns > :nth-child(2) .label", 'Traveller Email');
  await waitForText(page, "#el-id-8123-1461", 'Lary@bagto.com');
}

async function validate_contact_details() {
  await validate_booker_s_phone_number();
  await validate_traveler_s_phone_number();
  await validate_traveler_s_email();
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Book_and_finalize_with_contact_details() {
  await waitForText(page, "h1", 'Booking details');
  await waitForText(page, ".el-checkbox__label", /share the contact details/);
  await waitForText(page, ".email-input [type='text']", /@/);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

