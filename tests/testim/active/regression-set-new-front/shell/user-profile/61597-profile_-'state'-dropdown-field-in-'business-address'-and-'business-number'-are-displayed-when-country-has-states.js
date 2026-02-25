/*
 * Test Name: 61597 Profile -  'State' dropdown field in 'Business Address' and 'Business Number' are displayed when country has states
 * Description: 
 * Status: Active
 * Labels: Profile,Regression,state,phone number,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-05T08:10:07Z
 * Updated: 2025-09-14T10:51:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bruninatist@brunaadmin.com');
  await Check_if__state__and__business_number__are_displayed();
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

async function Check_if__state__and__business_number__are_displayed() {
  await Navigating_to_user_profile();
  await page.click("[id='tab-contactInformation'] p");
  await waitForText(page, "[id='tab-contactInformation'] p", 'Contact Information');
  await waitForText(page, "#el-id-4569-991", '123');
  await waitForText(page, "#el-id-4569-992", '456');
  await waitForText(page, "#el-id-4569-992", '456');
  await waitForText(page, "#el-id-4569-993", '7777');
  await waitForText(page, ".contact-info-form-content > :nth-child(6) > :nth-child(5) .label", 'State');
  await waitForText(page, ".contact-info-form-content > :nth-child(6) > :nth-child(5) .el-select__placeholder span", 'Texas (TX)');
}

