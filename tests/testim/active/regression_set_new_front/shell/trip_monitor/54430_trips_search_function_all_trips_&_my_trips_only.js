/*
 * Test Name: 54430 Trips - Search  function, all trips & 'my trips only'
 * Description: 
 * Status: Active
 * Labels: Trip monitor,Regression,Amsalem,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-11-20T05:34:01Z
 * Updated: 2025-07-22T07:01:59Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('nicolecarolina@fusion.com');
  await Navigate_to_Trips();
  await Search__validate_filter__new_tab_created();
  await Refresh_page__results_tab_removed();
  await __My_trips_only___no_results_for_other_travelers();
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
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function Navigate_to_Trips() {
  await page.click("[title='Trips'] .material-symbols-outlined");
  await waitForText(page, "[class^='is-flex-gap'], [class*=' is-flex-gap']", /^Found/);
}

async function Search_Results_for_specific_traveler() {
  await waitForText(page, "[id='pane-search-results'] .trip-list > :nth-child(1) .passengers > :nth-child(2)", /Falcao Rappa/);
}

async function Search__validate_filter__new_tab_created() {
  await page.type("#el-id-178-20", 'Falcao Rappa');
  //TODO Please add an assertion here
await isVisible(page, ".el-dropdown__popper [aria-disabled='true']");
  await waitForText(page, "#el-id-178-21 > li:nth-child(3)", 'Click here to expand your search  arrow_right_alt');
  await sendSpecialCharacter(page, "#el-id-178-20", 'Enter');
  await waitForText(page, "#tab-search-results", 'Search results');
  await page.waitForSelector("[id='pane-search-results'] .trip-list > :nth-child(2) .card-content", {state: "visible"});
  await Search_Results_for_specific_traveler();
}

async function Refresh_page__results_tab_removed() {
  await page.reload();
  //TODO Please add an assertion here
await isVisible(page, ".trip-list > :nth-child(2)");
  await waitForText(page, "[id='tab-upcoming-trips'] p", 'Upcoming');
  await waitForText(page, "[id='tab-intravel-trips'] p", 'Active');
  await waitForText(page, "[id='tab-past-trips'] p", 'Past');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function __My_trips_only___no_results_for_other_travelers() {
  await page.click(".app-filter__content > :nth-child(3) .el-checkbox__inner");
  await page.click("#el-id-7747-11");
  await page.type("#el-id-7747-11", 'Amelia Eckhardt');
  await sendSpecialCharacter(page, "#el-id-7747-11", 'Enter');
  await page.waitForSelector("[id='pane-search-results'] .material-symbols-outlined", {state: "visible"});
  await waitForText(page, "[id='pane-search-results'] .has-text-weight-bold", '0');
  await page.click("[id='tab-past-trips'] p");
  await waitForText(page, "[id='pane-past-trips'] .trip-list > :nth-child(1) .consultant-wrapper span", 'Consultant');
  await page.click(".app-filter__content > :nth-child(3) .el-checkbox__inner");
  await waitForText(page, "[id='pane-past-trips'] .has-text-weight-bold", '1');
  await page.type("#el-id-3513-11", 'Amelia Eckhardt');
  await waitForText(page, "strong", '0');
  await waitForText(page, "[id='pane-past-trips'] .has-text-weight-bold", '0');
}

