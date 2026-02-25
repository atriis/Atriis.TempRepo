/*
 * Test Name: 66119 Sunny Cars - Expired quote is not displayed in checkout summary
 * Description: 
 * Status: Active
 * Labels: Cars,Expiry,Checkout,SunnyCars Regression,2026 plan 2,02
 * Owner: Bruna Santos
 * Created: 2025-08-28T02:44:33Z
 * Updated: 2025-12-17T08:42:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('kaylesun@tlcfaketestsunnycar.com');
  await Navigate_to__Expired__trip();
  await Search_car_from_cart();
  await Add_car_from_results_page_to_cart();
  await Pending_Booking___Wait_for_element_text();
  await Add_credit_card_in_cart();
  await Fill_free_text_justification_in_cart_if_needed();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Price_only_for_one_quote_in_checkout_is_displayed();
  await Click_cart();
  await Pending_Booking___Wait_for_element_text();
  await Cancel_just_the__Pending_Booking__quote();
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

async function Go_to_Trips() {
  await page.click(".top-container > :nth-child(5) .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
}

async function Go_to__My_trips__and_search_specific_trip(tripNumber) {
  await Go_to_Trips();
  await page.type("[placeholder='Location, trip or travellers']", tripNumber);
}

async function Navigate_to__Expired__trip() {
  await waitForText(page, "h1", /Welcome/);
  await Go_to__My_trips__and_search_specific_trip('3536678');
  await waitForText(page, "[aria-disabled='false']", 'Click here to expand your search  arrow_right_alt');
  await page.click("[aria-disabled='false']");
  await waitForText(page, ".trip-id", '3536678');
  await waitForText(page, ".trip-title", 'Trip To Palma De Majorca');
  await page.click(".app-label");
}

async function Search_car_from_cart() {
  await waitForText(page, ".app-columns [class^='is-flex-gap'], [class*=' is-flex-gap']", 'Expired');
  await page.click(".flicking-camera > :nth-child(1) .icon-text");
  await waitForText(page, ".el-checkbox__label", 'Drop-off at a different location');
  await page.type("#el-id-503-384", 'Barcelona Intl. (BCN),Barcelona, Spain');
  await page.click("[id*='id'] .has-text-weight-bold");
  await page.click("#el-id-7897-241");
  await page.click("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] tbody > :nth-child(3) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9281-244");
  await page.click("[id='el-id-3813-113'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".btn--size-large");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Credit_Guard_modal_insert_cc_number(ccNumber) {
  await page.click("[placeholder='Please enter your credit card number']");
  await page.type("[placeholder='Please enter your credit card number']", ccNumber);
  await page.waitFor(500);
  await page.click("body > :nth-child(14) .btn--primary");
}

async function Add_credit_card_in_cart() {
  await page.click(".add-form-payment");
  await page.click(".add-credit");
  await page.click(".form-inputs > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4685-522 > div > div:nth-child(1) > span");
  await page.type("[placeholder='Card holder name']", 'Sunny Atriis');
  await page.click(".form-inputs > :nth-child(5) > :nth-child(1) .el-select__caret");
  await page.click("#el-id-2829-778");
  await page.click(".form-inputs > :nth-child(5) > :nth-child(2) .el-select__caret");
  await page.click("#el-id-2829-1079 > span");
  await page.click(".is-transparent span");
  await page.type("#el-id-2829-1375", 'israel');
  await page.click("#el-id-2829-1492 > span");
  await page.type("[placeholder='City name']", 'Tel Aviv Yafo');
  await page.type("[placeholder='Zip code']", '6654115');
  await page.type("[placeholder='Street name']", 'Yigal Alon 30');
  await page.click(".insertCard");
  await Credit_Guard_modal_insert_cc_number(4580458045804580);
  await page.waitFor(1000);
  await page.click(".btn-save");
  await waitForText(page, ".successfully-saved", /Payment added successfully/);
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
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

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
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

async function Price_only_for_one_quote_in_checkout_is_displayed() {
  await waitForText(page, "h6", 'Cart');
  await waitForText(page, ".summary-title", 'Hire a car at Barcelona Intl. (BCN),Barcelona, Spain');
  await List_length__with_css_locator_as_parameter_('1', '.quote-icon');
}

async function Click_cart() {
  await page.click(".cart-btn .material-symbols-outlined");
  await page.waitForSelector(".page-layout-main .icon-img", {state: "visible"});
}

async function Cancel_just_the__Pending_Booking__quote() {
  await page.hover("#el-id-7897-786");
  await waitForText(page, "#el-id-8246-789 > li > span", 'Cancel item');
  await page.click("#el-id-8246-789 > li > span");
  await waitForText(page, ".el-dialog__title", /Cancel item/);
  await waitForText(page, "[aria-label='Cancel item - Hire a car at Barcelona Intl. (BCN),Barcelona, Spain'] .btn--primary", 'Cancel item');
  await page.dblclick("[aria-label*='Cancel item'] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  await page.click(".close-btn");
}

