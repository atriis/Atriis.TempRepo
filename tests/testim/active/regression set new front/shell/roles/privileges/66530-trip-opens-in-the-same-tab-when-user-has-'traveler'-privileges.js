/*
 * Test Name: 66530 Trip opens in the same tab when user has 'Traveler' privileges
 * Description: 
 * Status: Active
 * Labels: traveler,Regression,Privileges,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-09-05T05:04:51Z
 * Updated: 2025-10-28T02:01:52Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('lurdesmacedo@traveler.com');
  await Navigate_to__My_Trips_();
  await Filter_by_any_option_in_results_page('Cancelled');
  await Go_to__My_trips__and_search_specific_trip('3536672');
  await Go_to_the_trip_actual_trip();
  await Trip_does_not_open_in_the_same_tab_without_the_privilege();
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

async function Navigate_to__My_Trips_() {
  await waitForText(page, ".trips-title .trips-subtitle", 'How would you like to start your next trip?');
  await page.click(".top-container > :nth-child(5) .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
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

async function Go_to_Trips() {
  await page.click(".top-container > :nth-child(5) .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
}

async function Go_to__My_trips__and_search_specific_trip(tripNumber) {
  await Go_to_Trips();
  await page.type("[placeholder='Location, trip or travellers']", tripNumber);
}

async function Go_to_the_trip_actual_trip() {
  await page.click("[aria-disabled='false']");
}

async function Trip_does_not_open_in_the_same_tab_without_the_privilege() {
  await page.click(".app-label");
  await waitForText(page, ".tab", 'Overview');
}

