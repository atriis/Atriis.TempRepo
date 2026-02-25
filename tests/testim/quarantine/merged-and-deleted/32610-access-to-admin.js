/*
 * Test Name: 32610 access to admin
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: pini harush
 * Created: 2023-06-28T10:06:22Z
 * Updated: 2023-10-01T12:00:29Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('admin@full.com');
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[title='Justifications Table']", /Justifications/);
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

