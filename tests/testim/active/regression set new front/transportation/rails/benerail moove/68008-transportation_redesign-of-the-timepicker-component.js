/*
 * Test Name: 68008 Transportation - Redesign of the time-picker component
 * Description: 
 * Status: Active
 * Labels: Rail,Benerail Moove Regression,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-09-26T04:29:26Z
 * Updated: 2025-09-26T05:09:27Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://ui-dev.gtp-staging.com/");
  await Login('beny@moove.com');
  await book_a_new_trip();
  await Validate_Time_picker();
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

async function Validate_Time_picker() {
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.click("#el-id-2191-41");
  await page.click("[name='hours'] [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(500);
  await page.click("#el-id-701-49 > span");
  await waitForText(page, "#el-id-2191-41", '04:00');
  await page.click("[name='minutes'] .el-select__placeholder");
  await page.waitFor(500);
  await page.click("#el-id-9771-74 > span");
  await waitForText(page, "#el-id-2191-41", '04:45');
  await page.click("#el-id-9771-41");
  await page.click(".eu-rail-form-container > :nth-child(2)");
  await waitForText(page, "#el-id-2191-41", '04:45');
}

