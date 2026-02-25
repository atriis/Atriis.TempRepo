/*
 * Test Name: 36581 Flight - Price for multi pax is displayed correctly in the cart and checkout + Squake tooltip
 * Description: 
 * Status: Active
 * Labels: multi pax,Flights,Regression,CO2,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-09-28T12:11:55Z
 * Updated: 2026-01-26T03:26:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("sebastian@one.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await add_second_traveler_by_name("josh");
  await add_third_traveller("bene");
  await Search_flights_one_way("lis", "nyc");
  await page.waitFor(2000);
  await close_mandatory_notification();
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await scrollTo(page, 0, 400);
  await Squake_tooltip();
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .amount");
  await Add_to_trip_flight();
  await Squake_tooltip_1();
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await scrollToElement(page, ".price-breakdown-btn");
  await page.click(".price-breakdown-btn");
  await page.waitForSelector("h3", {state: "visible"});
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .original-price .amount");
  //TODO Please add an assertion here
await getText(page, ".amounts > :nth-child(2) .amount");
  await scrollOnElement(page, ".el-drawer__body", 0, 315.5555419921875);
  //TODO Please add an assertion here
await getText(page, ".summary-and-actions .amount");
  await page.click("#el-drawer__title > button > i");
  await Validate_price_on_cart_is_correct_1();
  await Add_credit_card_in_cart();
  await page.waitForSelector(".fop-box", {state: "visible"});
  await Accept_and_proceed_to_checkout();
  await page.waitFor(6000);
  await Price_change_prompt();
  await waitForText(page, ".price-summary .amount", priceincartwithcurrency);
  await waitForText(page, ".contact-details-container [class^='is-size'], [class*=' is-size']", 'Contact details');
  await Click_cart();
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

async function scrollOnElement(page, selector, x, y) {
  await page.evaluate(([selector, x, y]) => {
    const element = document.querySelector(selector);
    element.scroll(x, y);
  }, [selector, x, y]);
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

async function add_second_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("h2");
  if (false) {
    await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  }
  if (false) {
    // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  }
  await page.waitFor(2000);
}

async function add_third_traveller(name) {
  await page.waitFor(2000);
  await page.click(".add-btn .is-flex");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("#el-id-5736-287-item-0 > div");
  await page.waitForSelector(".travelers-list > section:nth-of-type(2) .traveler-name", {state: "visible"});
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

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Squake_tooltip() {
  await page.click(".flight-list > :nth-child(2) .is-size-5");
  await waitForText(page, ".emission-description-bold", 'Emissions are calculated per passenger in the selected class of service.');
  await page.click("[id='el-popper-container-2151'] .material-symbols-outlined");
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await waitForText(page, "[aria-label='Flight details'] .flight-duration > :nth-child(1) .loc-code", 'LIS');
  await page.click("[aria-label='Flight details'] .is-size-5");
  await waitForText(page, ".emission-description-bold", 'Emissions are calculated per passenger in the selected class of service.');
  await page.click("[id='el-popper-container-2151'] .material-symbols-outlined");
  await page.click("#logged-in-page > div > section > section > main > section > main > section > div:nth-child(3) > div > header > button > i > svg > path");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function close_mandatory_notification_1() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_flight() {
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await close_mandatory_notification_1();
  await Pending_booking___wait_for_element_text();
}

async function Squake_tooltip_1() {
  await page.hover("[class$='emissions-label'], [class*='emissions-label ']");
  await waitForText(page, ".emission-description-bold", 'Emissions are calculated per passenger in the selected class of service.');
  await page.click(".more-details-btn");
  await waitForText(page, ".open .flight-duration > :nth-child(1) .loc-code", 'LIS');
  await page.hover(".open [class$='emissions-label'], [class*='emissions-label ']");
  await waitForText(page, ".emission-description-bold", 'Emissions are calculated per passenger in the selected class of service.');
  await page.click("#pane-overview > div > section > section > div:nth-child(2) > div > header > button > i > svg > path");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Validate_price_on_cart_is_correct(pricepertraveller, price1adult, tax1adult, totalpriceincart) {
  await page.evaluate((pricepertraveller, price1adult, tax1adult, totalpriceincart) => {
    const TOLERANCE = 0.90; // Define the tolerance constant
    
    // Calculate the relevant prices
    let calculatedprice1adult = Number(price1adult) + Number(tax1adult);
    let calculatedtotalprice = calculatedprice1adult * 3;
    let round_calculatedtotal = calculatedtotalprice.toFixed(2);
    let price1adultdifference = calculatedprice1adult - Number(pricepertraveller);
    let totalpricedifference = calculatedtotalprice - Number(totalpriceincart);
    
    // Validate if price per traveller is correct
    if (Math.abs(calculatedprice1adult - Number(pricepertraveller)) <= TOLERANCE) {
        console.log(`Price per traveller is correct: ${calculatedprice1adult}; ${pricepertraveller}`);
    } else {
        throw new Error(`Price per traveller is not correct: ${calculatedprice1adult}; ${pricepertraveller}`);
    }
    
    // Validate if price in the breakdown page is correct
    if (totalpriceinbreakdownpage == totalpriceincart) {
        console.log(`Sum is correct: ${totalpriceinbreakdownpage}; ${totalpriceincart}`);
    } else {
        throw new Error(`Sum is not correct: ${totalpriceinbreakdownpage}; ${totalpriceincart}`);
    }
    
    // Validate if the total price in the cart is correct
    if (Math.abs(round_calculatedtotal - totalpriceincart) <= TOLERANCE) {
        console.log(`Total price is correct: ${round_calculatedtotal}; ${totalpriceincart}`);
    } else {
        throw new Error(`Total price is not correct: ${round_calculatedtotal}; ${totalpriceincart}`);
    }
    
  }, pricepertraveller, price1adult, tax1adult, totalpriceincart);
}

async function Validate_price_on_cart_is_correct_1() {
  await Validate_price_on_cart_is_correct(pricepertraveller, price1adult, tax1adult, totalpriceincart);
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

async function Click_cart() {
  await page.click(".cart-btn .material-symbols-outlined");
  await page.waitForSelector(".page-layout-main .icon-img", {state: "visible"});
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

