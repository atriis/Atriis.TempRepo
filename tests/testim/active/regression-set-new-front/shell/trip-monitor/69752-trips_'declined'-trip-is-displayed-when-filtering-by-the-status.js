/*
 * Test Name: 69752 Trips - 'Declined' trip is displayed when filtering by the status
 * Description: 
 * Status: Active
 * Labels: Regression,Trips,tripstatus,Filters,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-11-03T04:04:23Z
 * Updated: 2025-11-03T04:47:14Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('karenramirez@approvalflowtripmonitor.com');
  await Make_sure_home_page_loaded();
  await Go_to_Trips_and_search_specific_trip('3568167');
  await Navigate_to_trip();
  await Filter_by__Declined__and_see_trip_shown();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function Make_sure_home_page_loaded() {
  await waitForText(page, "h1", 'Welcome Karen Ramirez');
}

async function Go_to_Trips() {
  await page.click(".top-container > :nth-child(5) .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
}

async function Go_to_Trips_and_search_specific_trip(tripNumber) {
  await Go_to_Trips();
  await page.type("[placeholder='Location, trip or travellers']", tripNumber);
}

async function Navigate_to_trip() {
  await waitForText(page, "[aria-disabled='false']", 'Click here to expand your search  arrow_right_alt');
  await page.click("[aria-disabled='false']");
  await waitForText(page, "[id='pane-search-results'] [class^='is-flex-gap'], [class*=' is-flex-gap']", 'Found 1Trip');
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

async function Filter_by__Declined__and_see_trip_shown() {
  await page.click(".clear-all-btn");
  await waitForText(page, "[id='pane-search-results'] h3", 'No results found');
  await Filter_by_any_option_in_results_page('Declined');
  await waitForText(page, ".app-label", 'Declined');
  await waitForText(page, ".trip-id", '3568167');
}

