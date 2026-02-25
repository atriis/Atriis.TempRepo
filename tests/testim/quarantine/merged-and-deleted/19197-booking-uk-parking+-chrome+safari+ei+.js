/*
 * Test Name: 19197 Booking UK Parking+ CHROME+SAFARI+EI+
 * Description: Missing "sort by" and "filters"
 * Status: Quarantine
 * Labels: 
 * Owner: Unassigned
 * Created: 2023-06-19T06:38:11Z
 * Updated: 2025-05-20T09:34:27Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login("rafaelrocha@parkinguk.com");
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await UK_Parking_search('lhr');
  await page.click(".is-focus .el-checkbox__inner");
  await UK_Parking_More_details_validation();
  await scrollToElement(page, ".parking-list > :nth-child(1) .desktop-btn");
  await Add_to_trip_Parking_UK();
  await UK_Parking_Trip_overview('351867584644', 'honda', 'civic', 'bd51 m', 'black', 'fr456', '1', 'fr576', '2');
  await Accept_and_proceed_to_checkout();
  await UK_Parking_Book_and_Finalize();
  await UK_Parking_Validate_booking_details();
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function UK_Parking_search(UKAirport) {
  await page.click("[valuekey='value']");
  await page.type("[valuekey='value']", UKAirport);
  await page.click("[role='region'] .has-text-weight-bold");
  await page.click("[placeholder='Parking from']");
  await page.dblclick("[aria-label='Next Month']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(7) span");
  await page.click(".form-date-section > div:nth-of-type(2) [placeholder='Time']");
  await page.click(".form-date-section > div:nth-of-type(2) .btn-apply");
  await page.click("[placeholder='Return Date']");
  await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > td:nth-of-type(7) span");
  await page.click(".form-date-section > div:nth-of-type(4) [placeholder='Time']");
  await page.click(".form-date-section > div:nth-of-type(4) .btn-apply");
  await page.waitFor(2000);
  await page.click(".search-btn");
  await waitForText(page, ".show-count p", /Showing/);
}

async function UK_Parking_More_details_validation() {
  await page.click(".parking-list > :nth-child(1) .more-details-btn");
  //TODO Please add an assertion here
await isVisible(page, ".el-tabs__content");
  await page.click("#el-drawer__title > button > i");
  await page.click(".parking-list > :nth-child(5) .more-details-btn");
  //TODO Please add an assertion here
await isVisible(page, ".el-tabs__content");
  await page.click("#el-drawer__title > button > i");
}

async function Add_to_trip_Parking_UK() {
  await page.click(".parking-list > :nth-child(1) .desktop-btn");
  await waitForText(page, ".quote-title", /Park/);
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

async function UK_Parking_Book_and_Finalize() {
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__title", 'Success');
}

async function UK_Parking_Validate_booking_details() {
  await page.click(".btn-container > :nth-child(1)");
  await page.waitForSelector(".has-text-weight-semibold", {state: "visible"});
  await waitForText(page, ".pnr-code", /PNR  /);
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

