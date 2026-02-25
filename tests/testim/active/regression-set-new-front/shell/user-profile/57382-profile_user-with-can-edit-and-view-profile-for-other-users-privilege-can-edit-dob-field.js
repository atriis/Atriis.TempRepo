/*
 * Test Name: 57382 Profile - User with "Can edit and view profile for other users" privilege can edit DOB field
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,Profile,Privileges,edit,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-01-28T01:55:41Z
 * Updated: 2026-01-06T09:02:09Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('franciscosantos@editprofileprivilege.com');
  await book_a_new_trip();
  await add_traveler_by_name('ruimariano');
  await User_with__Can_edit_and_view_profile_for_other_users__privilege_can_edit_DOB_field();
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function User_with__Can_edit_and_view_profile_for_other_users__privilege_can_edit_DOB_field() {
  await waitForText(page, ".traveler-name", 'Rui Mariano');
  await page.click(".traveler-name");
  await page.click("#el-id-5861-39");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
}

