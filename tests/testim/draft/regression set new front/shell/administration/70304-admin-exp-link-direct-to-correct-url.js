/*
 * Test Name: 70304 Admin exp link direct to correct URL
 * Description: admin> show "expense display name"  + URL
 * Status: Draft
 * Labels: Administration,Expense
 * Owner: pini harush
 * Created: 2025-11-17T07:09:16Z
 * Updated: 2025-12-24T07:20:00Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('Testim@test.imm');
  await waitForText(page, ".top-container > :nth-child(8) .icon-container > :nth-child(2)", 'vvv - Expenses');
  await page.click(".top-container > :nth-child(8) .icon-container > :nth-child(2)");
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

