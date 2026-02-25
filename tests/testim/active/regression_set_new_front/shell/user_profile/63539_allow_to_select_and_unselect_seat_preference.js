/*
 * Test Name: 63539 Allow to select and unselect seat preference
 * Description: 
 * Status: Active
 * Labels: Daily Shell,Regression,2026 plan 2
 * Owner: Yael
 * Created: 2025-06-17T07:07:33Z
 * Updated: 2025-06-20T01:17:30Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('TECHNOLOGIESCH@e.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.click(".traveler-name");
  await page.click("[id='tab-travelPreferences'] p");
  await page.click(".travel-preferences-form-content > :nth-child(3) .el-select__wrapper");
  await page.click("#el-id-5038-1569");
  await page.click(".btn--primary > :nth-child(2)");
  await page.click(".travel-preferences-form-content > :nth-child(3) .el-select__placeholder");
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

