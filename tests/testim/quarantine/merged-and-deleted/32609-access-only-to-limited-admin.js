/*
 * Test Name: 32609 access only to limited admin
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: pini harush
 * Created: 2023-06-28T10:06:22Z
 * Updated: 2024-02-01T12:55:32Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('admin@limited.com');
  await page.click("[to='/'] .material-symbols-outlined");
  await _32609();
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

async function limit_admin() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function _32609() {
  await waitForText(page, "[title='Users']", /Users/);
  await waitForText(page, "[title='Point of Interest']", /Point of Interest/);
  await waitForText(page, "[title='Preferred Hotels']", /Preferred Hotels/);
  await waitForText(page, "[title='Quick Links']", /Quick Links/);
  await limit_admin();
}

