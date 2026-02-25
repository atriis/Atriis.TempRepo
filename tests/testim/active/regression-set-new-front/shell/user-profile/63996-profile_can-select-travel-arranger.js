/*
 * Test Name: 63996 Profile - Can select Travel Arranger
 * Description: 
 * Status: Active
 * Labels: Regression,Profile,Travel Arranger,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-07-25T12:50:08Z
 * Updated: 2025-09-17T11:25:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('Stuart@Stuart.com');
  await Navigating_to_user_profile();
  await tst();
  await tst2();
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

async function Navigating_to_user_profile() {
  await waitForText(page, "h1", /Welcome/);
  await page.hover(".passenger-avatar");
  await page.click(".user-profile-link p");
}

async function tst() {
  await page.click("[id='tab-permissions'] p");
  await waitForText(page, "#tab-travellers > div > p", 'Who can I book for');
  await page.click("#tab-travellers > div > p");
  await page.click("[xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".el-vl__window div > :nth-child(8) span", 'Yael Alef');
  //TODO Please add an assertion here
await isVisible(page, ".el-vl__window div > :nth-child(8)");
  await page.click(".el-vl__window div > :nth-child(8) span");
  await page.waitFor(2000);
  await waitForText(page, ".el-select__placeholder", 'Select user to add');
}

async function tst2() {
  await page.click("#el-id-5275-478");
  await page.click(".el-select__placeholder");
  await page.type("#el-id-3361-482", 'rita franklin');
  await page.click(".el-select-dropdown span");
  await page.waitFor(2000);
  await waitForText(page, ".el-select__placeholder span", 'Rita Franklin');
}

