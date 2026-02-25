/*
 * Test Name: 58361 Profile - User can add and remove backup approver
 * Description: 
 * Status: Active
 * Labels: Regression,Profile,backup approver,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-02-14T12:06:41Z
 * Updated: 2025-09-17T11:53:10Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('hayley@backupapprover.com');
  await Navigating_to_user_profile();
  await User_can_add_and_remove_backup_approver();
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

async function Navigating_to_user_profile() {
  await waitForText(page, "h1", /Welcome/);
  await page.hover(".passenger-avatar");
  await page.click(".user-profile-link p");
}

async function User_can_add_and_remove_backup_approver() {
  await page.click(".personal-details-form-content > :nth-child(7) [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-8-50", 'testim');
  await page.click("[id='el-id-8-33'] [aria-selected='false']");
  await waitForText(page, ".personal-details-form-content > :nth-child(7) .el-select__placeholder", /TESTIM/);
  await page.click(".btn--primary > :nth-child(2)");
  await waitForText(page, ".el-notification__title", 'Success');
  await page.hover(".personal-details-form-content > :nth-child(7) [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".personal-details-form-content > :nth-child(7) .el-select__suffix > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".btn--primary > :nth-child(2)");
  await waitForText(page, ".el-notification__title", 'Success');
  await waitForText(page, ".personal-details-form-content > :nth-child(7) .el-select__placeholder", 'Select');
}

