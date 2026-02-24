/*
 * Test Name: 56771 DB - Profile - Frequent Programs - "DB BahnCard 50" expiration date saves correctly
 * Description: 
 * Status: Active
 * Labels: Regression,Profile,Frequent flyer,Rail,DB Rail,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-01-15T10:47:35Z
 * Updated: 2025-11-10T01:40:14Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunorodolfo@dbrail.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Navigating_to_profile_after_adding_traveler();
  await k();
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

async function Navigating_to_profile_after_adding_traveler() {
  await page.click(".traveler-name");
  await page.click("[id='tab-frequentPrograms'] p");
  await waitForText(page, ".frequent-programs-form-content > :nth-child(1)", 'Frequent Flyer program');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function k() {
  await page.click(".frequent-programs-form-content > :nth-child(8) > :nth-child(3)");
  await page.click(".app-select [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4072-478");
  await waitForText(page, ".app-select span", 'DB BahnCard 50');
  await page.type("#el-id-9711-538", '1234567890');
  await page.type("#el-id-9162-520", '20 Dec 2027');
  await page.click(".btn--primary > :nth-child(2)");
  await Success_toast_alert();
  await waitForText(page, "#el-id-5062-533", '20 Dec 2027');
  await page.click(".remove-btn");
  await waitForText(page, "body > :nth-child(13) p", 'Are you sure you want to delete this item?');
  await page.click("body > :nth-child(13) .btn--primary");
}

