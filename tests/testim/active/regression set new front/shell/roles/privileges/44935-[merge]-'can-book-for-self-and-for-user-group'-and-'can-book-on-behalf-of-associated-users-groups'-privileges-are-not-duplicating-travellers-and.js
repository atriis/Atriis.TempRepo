/*
 * Test Name: 44935 [Merge] 'Can book for self and for user group' and 'Can Book On Behalf Of Associated Users Groups' privileges are not duplicating travellers and are able to co-exist
 * Description: 
 * Status: Active
 * Labels: Regression,Administration,Privileges,merge,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-04-18T08:22:06Z
 * Updated: 2026-02-17T06:44:35Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('amylee@privileges.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await waitForText(page, ".traveler-name", 'Amy Lee');
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await page.click(".add-btn .is-flex");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'amy lee');
  //TODO Please add an assertion here
await isVisible(page, "#el-autocomplete-6013-item-0");
  // Converting a 'negative-element-validation' step has to be done manually at this time
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

