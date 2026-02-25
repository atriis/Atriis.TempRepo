/*
 * Test Name: 44014 Parking - Display "reset filter" when there are no results
 * Description: 
 * Status: Active
 * Labels: UK Parking,Regression,Daily Transportation,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-02-26T09:30:54Z
 * Updated: 2025-12-15T03:57:00Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('rafaelrocha@parkinguk.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await search_UK_parking_by_airport('LHR');
  await Parking___Results___Wait_for__Add_to_trip__text();
  await Filter_by_any_option_in_results_page('Terminal 4');
  await Filter_by_any_option_in_results_page('Park and Ride');
  await waitForText(page, ".page-layout-main .btn--primary", 'Reset Filters');
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

