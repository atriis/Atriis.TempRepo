/*
 * Test Name: 37304 Guest reference field is not displayed when adding a profiled user
 * Description: 
 * Status: Active
 * Labels: Regression,Reference Fields,GDS,Profile,guest,Sabre,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-10-07T02:25:16Z
 * Updated: 2026-02-16T02:40:32Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('tree@tree.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way("LIS", "NYC");
  await Verify_guest_ref_field_is_NOT_displayed___New_trip();
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Fill_free_text_justification_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await Validate_guest_ref_field_is_NOT_displayed___Checkout();
  await Click_cart();
  await On_Hold___Wait_for_element_text();
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

async function List_length__with_css_locator_as_parameter_(length, locator) {
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Answer_ref_fields_Chris_Tree_Fake_Test_and_proceed() {
  await page.click("[name='TRIP PURPOSE']");
  await page.click("#el-id-4843-941 > span");
  await page.click("[id^='el-collapse-content'] .traveler-questions > :nth-child(1) [fill='currentColor']");
  await page.click("[id*='id'] span");
  await Click_on_proceed_after_search();
}

async function Verify_guest_ref_field_is_NOT_displayed___New_trip() {
  await waitForText(page, "body > :nth-child(17) p", 'Please fill in the required information in order to proceed');
  await waitForText(page, ".general-section .label", 'REASON FOR DIVISION CHANGE');
  await waitForText(page, ".traveler-section .label", '*TRIP PURPOSEinfo');
  await List_length__with_css_locator_as_parameter_('2', '.label.is-capitalized.has-text-weight-normal.mb-0.is-flex.is-align-items-center');
  await Answer_ref_fields_Chris_Tree_Fake_Test_and_proceed();
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Fill_free_text_justification_in_cart_if_needed() {
  await scrollTo(page, 0, 493);
  if (await getText(page, ".oop-title") === "'Out of policy'") {
    await page.type("[autocomplete='off']", 'abc');
  }
  await page.waitFor(1000);
  if (await getText(page, ".help") === "'Please save your justification'") {
    await page.click("[id='pane-overview'] .btn");
  }
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

async function Validate_guest_ref_field_is_NOT_displayed___Checkout() {
  await waitForText(page, ".has-text-left", 'Contact details');
  await waitForText(page, "#el-collapse-head-1437 > div > span", 'Travellers Reference Questions');
  await scrollTo(page, 0, 121.77777862548828);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Click_cart() {
  await page.click(".cart-btn .material-symbols-outlined");
  await page.waitForSelector(".page-layout-main .icon-img", {state: "visible"});
}

async function On_Hold___Wait_for_element_text() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

