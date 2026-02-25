/*
 * Test Name: 40112 FQTV is removed from profile
 * Description: 
 * Status: Active
 * Labels: Regression,FQTV,Profile,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-01-31T07:28:49Z
 * Updated: 2025-07-14T07:31:05Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ritalee@frequentprogram.com');
  await Navigating_to_user_profile();
  await Removing_FQTV_from_profile();
  await Adding_FQTV_in_user_profile();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollToElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, selector);
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

async function Removing_FQTV_from_profile() {
  await page.click("[id='tab-frequentPrograms'] p");
  await waitForText(page, "#el-id-7872-498", '123456543');
  await page.click(".remove-btn");
  await waitForText(page, "body > :nth-child(13) p", 'Are you sure you want to delete this item?');
  await page.click("body > :nth-child(13) .btn--primary");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await waitForText(page, ".frequent-programs-form-content > :nth-child(1)", 'Frequent Flyer program');
}

async function Adding_FQTV_in_user_profile() {
  await page.click(".btn-container > :nth-child(1)");
  await page.click("[xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-vl__window div > :nth-child(1)");
  await page.type("#el-id-7872-495", '123456543');
  await scrollToElement(page, ".btn--primary");
  await page.click(".btn--primary > :nth-child(2)");
  await waitForText(page, ".el-notification__title", 'Success');
}

