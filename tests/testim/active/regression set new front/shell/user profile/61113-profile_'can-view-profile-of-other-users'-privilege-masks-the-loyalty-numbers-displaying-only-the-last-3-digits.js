/*
 * Test Name: 61113 Profile - 'Can view profile of other users' privilege masks the loyalty numbers, displaying only the last 3 digits
 * Description: 
 * Status: Active
 * Labels: Profile,"Can view profile of other users",Regression,Car loyalty number,Rail loyalty numbers,Hotel loyalty number,FQTV,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-04-21T10:03:58Z
 * Updated: 2025-07-14T07:14:07Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ariane@canviewprofileonly.com');
  await book_a_new_trip();
  await Add_traveler_by_name('Rui Mariano');
  await __Can_view_profile_of_other_users__privilege_masks_the_loyalty_numbers__displaying_only_the_last_3_digits();
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

async function __Can_view_profile_of_other_users__privilege_masks_the_loyalty_numbers__displaying_only_the_last_3_digits() {
  await waitForText(page, ".traveler-name", 'Rui Mariano');
  await page.click(".traveler-name");
  await waitForText(page, ".page-view .has-text-weight-bold", 'RM');
  await page.click("[id='tab-frequentPrograms'] p");
  await waitForText(page, ".frequent-programs-form-content > :nth-child(2)", new RegExp("\\*{9}333"));
  await waitForText(page, ".frequent-programs-form-content > :nth-child(8)", new RegExp("\\*{9}444"));
  await waitForText(page, ".frequent-programs-form-content > :nth-child(8)", new RegExp("\\*{9}101"));
  await waitForText(page, ".frequent-programs-form-content > :nth-child(8)", new RegExp("\\*{9}675"));
}

