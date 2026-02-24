/*
 * Test Name: 42861 Sunny Cars - "No Deposit" option is displayed for cars that have this option
 * Description: 
 * Status: Active
 * Labels: Cars,SunnyCars Regression,results,Regression,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-07-24T11:03:07Z
 * Updated: 2026-02-03T01:50:41Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('kaylesun@tlcfaketestsunnycar.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_car_by_place('Barcelona Intl. (BCN),Barcelona, Spain');
  await answer_ref_fields_chris_tree_and_proceed();
  await Results____Add_to_trip__on_Request();
  await __No_Deposit__option_is_displayed_for_cars_that_have_this_option();
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

async function Book_a_new_trip() {
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

async function Search_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-8945-194");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] tbody > :nth-child(5) > td:nth-of-type(1) .el-date-table-cell__text");
  await page.click("#el-id-8945-197");
  await page.click("[id*='id'] tbody > :nth-child(5) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function answer_ref_fields_chris_tree_and_proceed() {
  await page.click("[name='TRIP PURPOSE']");
  await page.click("#el-id-4843-941 > span");
  await page.click("[id^='el-collapse-content'] .traveler-questions > :nth-child(1) [fill='currentColor']");
  await page.click("[id*='id'] span");
  await Click_on_proceed_after_search();
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function Results____Add_to_trip__on_Request() {
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".el-switch__action");
  await waitForText(page, ".car-list > :nth-child(1) .car-features > :nth-child(1) p", 'On request');
}

async function __No_Deposit__option_is_displayed_for_cars_that_have_this_option() {
  await page.hover(".car-list > :nth-child(1) .dots-icon");
  await waitForText(page, "#el-id-7239-304 > section > div > div:nth-child(4) > p", 'No deposit');
}

