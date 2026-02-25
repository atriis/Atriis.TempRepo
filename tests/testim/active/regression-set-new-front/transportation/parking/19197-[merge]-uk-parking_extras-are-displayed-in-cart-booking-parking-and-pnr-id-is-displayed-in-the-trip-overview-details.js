/*
 * Test Name: 19197 [Merge] UK Parking - extras are displayed in cart, booking parking and PNR ID is displayed in the trip overview details
 * Description: 
 * Status: Active
 * Labels: UK Parking,Regression,performance,No Amadeus Hotel Book,merge,Full Purchase,progress page,Pre Prod,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-01-04T12:36:05Z
 * Updated: 2025-10-30T08:08:04Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('priscilamadalena@ukparkingpris.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await search_UK_parking_by_airport('LHR');
  await Parking___Results___Wait_for__Add_to_trip__text();
  await Filter_by_any_option_in_results_page('Park and Ride');
  await Add_to_trip_Parking_UK();
  await Pending_booking___wait_for_element_text();
  await UK_Parking_Trip_overview('1234567890', 'Tesla', 'Car', 'ABC123', 'Black', '1234', '3', '6777', '3');
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await waitForText(page, ".pnr-code", /PNR/);
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

async function Add_to_trip_Parking_UK() {
  await page.click(".parking-list > :nth-child(1) .desktop-btn");
  await waitForText(page, ".quote-title", /Park/);
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
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

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
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

