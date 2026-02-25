/*
 * Test Name: 23102 Tabs in cart
 * Description: Request Assistance of hotel, car and EU rail
 * Status: Quarantine
 * Labels: Fit for Prod
 * Owner: pini harush
 * Created: 2023-01-31T02:07:56Z
 * Updated: 2024-02-26T02:08:04Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('pini@gov2.nl');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Request_assistance__hotel('Lon');
  await page.click(".btn--primary");
  await page.click(".financial-section [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.type(".is-danger [type='text']", '123');
  await page.click("body > :nth-child(10) .btn--primary");
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "#tab-overview > div", 'Overview');
  await waitForText(page, "[id='tab-requests'] p", 'Requests');
  await waitForText(page, ".center-title", /Requested hotel/);
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Request_assistance__hotel(destination) {
  await page.click("#tab-hotel > div");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", destination);
  await page.waitFor(1000);
  await sendSpecialCharacter(page, "#el-id-7300-759", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(3)");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(4)");
  await page.click(".btn--default");
}

