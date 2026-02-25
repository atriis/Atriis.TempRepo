/*
 * Test Name: 70302 Admin exp link direct to sso
 * Description: sso stronger then: admin>"expense display name" field
 * Status: Draft
 * Labels: Administration,Expense,SSO
 * Owner: pini harush
 * Created: 2025-11-17T06:56:06Z
 * Updated: 2025-12-24T07:18:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('Testim@test.im');
  await waitForText(page, ".top-container > :nth-child(8) .icon-container > :nth-child(2)", 'Mesh - Expenses');
  await page.click(".top-container > :nth-child(8) .icon-container > :nth-child(2)");
  await waitForText(page, ".app4", 'Welcome to Mesh');
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

