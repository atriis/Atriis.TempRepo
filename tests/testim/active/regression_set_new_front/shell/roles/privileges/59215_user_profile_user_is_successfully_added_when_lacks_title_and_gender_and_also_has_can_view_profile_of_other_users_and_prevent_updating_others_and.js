/*
 * Test Name: 59215 User Profile - User is successfully added when lacks title and gender, and also has "Can view profile of other users"  and "Prevent updating others and own profile" privileges
 * Description: 
 * Status: Active
 * Labels: Profile,Regression,Privileges,"Can view profile of other users","Prevent updating others and own profile",2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-03-11T09:29:09Z
 * Updated: 2026-02-16T02:57:58Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('camilamaroon@specifictestt.com');
  await book_a_new_trip();
  await Add_traveler_by_name('Matthew McConaughey');
  await User_is_successfully_added_when_lacks_title_and_gender__and_also_has__Can_view_profile_of_other_users___and__Prevent_updating_others_and_own_profile__privileges();
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

async function Add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function User_is_successfully_added_when_lacks_title_and_gender__and_also_has__Can_view_profile_of_other_users___and__Prevent_updating_others_and_own_profile__privileges() {
  await waitForText(page, ".el-notification p", 'The traveller was successfully saved');
  await waitForText(page, ".traveler-name", 'Matthew McConaughey');
}

