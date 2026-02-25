/*
 * Test Name: 27929 Edit user profile
 * Description: 
 * Status: Quarantine
 * Labels: SH
 * Owner: pini harush
 * Created: 2023-03-26T03:30:01Z
 * Updated: 2023-03-27T07:33:47Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@prof.com');
  await page.hover(".app-header .has-text-weight-bold");
  await page.click(".user-profile-link p");
  await waitForText(page, ".avatar-container p", /Recommended size/);
  await page.click(".personal-details-form-content > :nth-child(3) > :nth-child(1) [type='text']");
  await page.type(".personal-details-form-content > :nth-child(3) > :nth-child(1) [type='text']", 'testim@prof.cob');
  await page.click(".personal-details-form-content .btn");
  await waitForText(page, "[role='alert'] p", 'Saved successfully');
  await page.click(".personal-details-form-content > :nth-child(3) > :nth-child(1) [type='text']");
  await page.type(".personal-details-form-content > :nth-child(3) > :nth-child(1) [type='text']", 'testim@prof.com');
  await page.click(".personal-details-form-content .btn");
  await waitForText(page, "[role='alert'] p", 'Saved successfully');
  await page.click(".logout-icon");
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

