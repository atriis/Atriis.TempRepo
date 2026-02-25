/*
 * Test Name: 33066 UK Parking - Adding to cart parking and it is not duplicated and it is possible to delete it
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-07-06T03:15:00Z
 * Updated: 2024-01-04T11:52:54Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("priscilamadalena@ukparkingpris.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await search_UK_parking_by_airport("LHR");
  await page.click(".is-focus .el-checkbox__inner");
  await Add_to_trip_Parking_UK();
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Pending Booking');
  await Cancel_quote_from_cart_before_checkout();
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

async function Add_to_trip_Parking_UK() {
  await page.click(".parking-list > :nth-child(1) .desktop-btn");
  await waitForText(page, ".quote-title", /Park/);
}

async function Cancel_quote_from_cart_before_checkout() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await page.click("[aria-label='Cancel item - '] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  if (false) {
    await page.click("body > :nth-child(12) .btn--primary");
  }
  if (false) {
    await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  }
  await page.click(".close-btn");
}

