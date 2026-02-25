/*
 * Test Name: 63996 Travel arrnager in the new ui - able to select in profile
 * Description: 
 * Status: Active
 * Labels: Daily Shell
 * Owner: Yael
 * Created: 2025-07-02T12:32:17Z
 * Updated: 2026-02-11T02:29:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com/");
  await Login('Stuart@Stuart.com');
  await page.click(".top-container > :nth-child(5) .icon-container > :nth-child(2)");
  await page.click("[id='tab-past-trips'] p");
  await page.click("[id='pane-past-trips'] .passengers > :nth-child(2)");
  await page.click(".traveler-name");
  await page.click(".el-tabs__nav");
  await page.click("[id='tab-permissions'] p");
  await page.click("[aria-describedby='el-id-9664-485'] .has-text-weight-bold");
  await page.click(".top-container > :nth-child(4) .icon-container > :nth-child(2)");
  await page.click(".add-btn .is-flex");
  await page.click("#el-id-5910-287");
  await page.click("#el-id-5910-287");
  await page.type("#el-id-5910-287", 'RI');
  await page.click("h2");
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

