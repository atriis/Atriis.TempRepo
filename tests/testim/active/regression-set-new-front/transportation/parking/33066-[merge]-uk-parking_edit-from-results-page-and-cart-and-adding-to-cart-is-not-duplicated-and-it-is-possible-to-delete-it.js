/*
 * Test Name: 33066 [Merge] UK Parking - Edit from results page and cart and adding to cart is not duplicated and it is possible to delete it
 * Description: 
 * Status: Active
 * Labels: price offer,UK Parking,Regression,No Amadeus Hotel Book,merge,Cart,Keeps failing,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-01-04T10:11:37Z
 * Updated: 2025-10-02T09:36:43Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await LOG_IN('rafaelrocha@parkinguk.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await search_UK_parking_by_airport('LHR');
  await Parking___Results___Wait_for__Add_to_trip__text();
  await Filter_by_any_option_in_results_page('Park and Ride');
  await Filter_by_any_option_in_results_page('Terminal 3');
  await UK_Parking___editing_results_from_search_page();
  await Add_to_trip_Parking_UK();
  await Pending_Booking___Wait_for_element_text();
  await k();
  await Validate__More_Details__content();
  await UK_Parking_Trip_overview('123121312', 'Tesla', 'Ts', '87878', '78236783', '8789', '3', '324', '1');
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Navigate_to_cart_from_checkout_page();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}


// shared steps \\
async function LOG_IN(username) {
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

async function search_UK_parking_by_airport(airport) {
  await page.click("[id='tab-parking'] p");
  await page.click("[placeholder='Search UK Airport']");
  await page.type("[placeholder='Search UK Airport']", airport);
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[placeholder='Parking from']");
  await page.click("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[id*='id']");
  await page.click("[aria-describedby='el-id-2948-33'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2918-2124 > span");
  await page.click("[id*='id']");
  await page.click("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[id*='id']");
  await page.click("[id*='id'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-3026-174 > span");
  await page.click("#pane-parking > h4");
  await page.click(".btn--primary");
}

async function Parking___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".parking-list > :nth-child(1) .btn--primary", 'Add to trip');
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

async function UK_Parking___editing_results_from_search_page() {
  await page.click(".edit-search-btn");
  await page.click("[placeholder='Parking from']");
  await page.click("[aria-hidden='false'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[aria-hidden='false'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-5682-339");
  await page.click("[aria-hidden='false'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--size-large");
  await waitForText(page, ".parking-list > :nth-child(1) .desktop-btn", 'Add to trip');
}

async function Add_to_trip_Parking_UK() {
  await page.click(".parking-list > :nth-child(1) .desktop-btn");
  await waitForText(page, ".quote-title", /Park/);
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Checking_if_there_is_only_one_parking_by_checking_if_the_cart_price_is_only_for_one_item() {
  await page.evaluate(() => {
    var equal = firstValue === secondValue
    
    if(!equal){
        throw new Error("Values are different, first value is " + firstValue + " and second value is " + secondValue)
    }
    else{
        console.log("Values are equal")
    }
  });
}

async function Checking_if_there_is_only_one_parking_by_checking_if_the_cart_price_is_only_for_one_item_1() {
  await Checking_if_there_is_only_one_parking_by_checking_if_the_cart_price_is_only_for_one_item();
}

async function k() {
  //TODO Please add an assertion here
await isVisible(page, ".quote-summary-list > section:nth-of-type(1) .summary-title");
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await Checking_if_there_is_only_one_parking_by_checking_if_the_cart_price_is_only_for_one_item_1();
}

async function Validate__More_Details__content() {
  await page.click(".ticket-top-section a");
  await waitForText(page, ".info-container > :nth-child(1) .section-title", 'Why book:');
  await page.click("#el-drawer__title > button > i");
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

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Click_cart() {
  await page.click(".cart-btn .material-symbols-outlined");
  await page.waitForSelector(".page-layout-main .icon-img", {state: "visible"});
}

async function Navigate_to_cart_from_checkout_page() {
  await waitForText(page, "#el-collapse-head-326 > div > span", 'Rafael  Rocha');
  await Click_cart();
  await Pending_Booking___Wait_for_element_text();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

