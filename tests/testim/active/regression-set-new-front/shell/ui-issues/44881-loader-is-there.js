/*
 * Test Name: 44881 Loader is there
 * Description: 
 * Status: Active
 * Labels: Regression,search,2026 plan 1
 * Owner: pini harush
 * Created: 2024-04-16T07:15:45Z
 * Updated: 2025-09-14T09:08:47Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('pax@prebook.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", 'lon');
  await page.click("[id='el-autocomplete-5154-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", 'mad');
  await page.click("[id='el-autocomplete-6199-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='Depart Date']");
  await page.click(".is-right tbody > :nth-child(3) > td:nth-of-type(3) span");
  await page.click(".end-date span");
  await page.click(".search-btn");
  //TODO Please add an assertion here
await isVisible(page, ".slideshow > :nth-child(2)");
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

