/*
 * Test Name: 36222 Manual quote - "Back" button is displayed
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-09-21T02:37:48Z
 * Updated: 2023-12-19T04:28:52Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunasantos@manualquote.com');
  await book_a_new_trip();
  await page.click(".is-capitalized");
  await waitForText(page, ".title-container p", 'Back');
  await page.click(".title-container p");
  await waitForText(page, ".welcome", 'Welcome back Bruna');
  await waitForText(page, "#pane-flight > h4", 'Find flights for your trip');
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

