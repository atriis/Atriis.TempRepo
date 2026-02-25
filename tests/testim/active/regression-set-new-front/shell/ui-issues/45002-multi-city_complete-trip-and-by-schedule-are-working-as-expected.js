/*
 * Test Name: 45002 Multi city - "Complete trip" and "By schedule" are working as expected
 * Description: 
 * Status: Active
 * Labels: Regression,UI,by schedule,Flights,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-04-23T10:24:11Z
 * Updated: 2025-09-14T09:10:52Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Selecting_different_cabins();
  await __Complete_trip__moved_to___By_schedule_();
  await __By_schedule__moves_to__Complete_trip__after_removing_the_Advanced_Search_mode();
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

async function Selecting_different_cabins() {
  await waitForText(page, ".flicking-camera > :nth-child(3) .el-radio__label", 'Multi city');
  await page.click(".flicking-camera > :nth-child(3) .el-radio__label");
  await page.type("[placeholder='From... Departure']", 'lon');
  await page.click("[id*='id'] .has-text-weight-bold");
  await page.type("[placeholder='To... Destination']", 'mad');
  await page.click("[id*='id'] .has-text-weight-bold");
  await page.click("[placeholder='Departure date']");
  await page.dblclick("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-leave-from tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".add-flight-btn");
  await page.click("[aria-activedescendant='el-autocomplete-3554-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-3554-item--1']", 'bangkok');
  await page.click(".autocomplete-result");
  await page.click(".last-line [placeholder='Departure date']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".last-line .class-input [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1499-128 > span");
}

async function __Complete_trip__moved_to___By_schedule_() {
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

async function __By_schedule__moves_to__Complete_trip__after_removing_the_Advanced_Search_mode() {
  await page.click("[id='pane-flight'] .remove-btn .material-symbols-outlined");
  await page.waitFor(3000);
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

