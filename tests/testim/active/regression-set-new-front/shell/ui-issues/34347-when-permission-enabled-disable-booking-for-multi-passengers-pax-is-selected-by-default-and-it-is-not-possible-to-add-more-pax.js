/*
 * Test Name: 34347 When permission enabled "Disable booking for multi passengers", pax is selected by default and it is not possible to add more pax
 * Description: 
 * Status: Active
 * Labels: Regression,No Amadeus Hotel Book,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-08-09T08:16:12Z
 * Updated: 2023-08-09T08:35:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('jessicacasellas@disablemultipassanger.com');
  await book_a_new_trip();
  await waitForText(page, ".traveler-name", 'Jessica Casellas');
  await page.waitForSelector(".star-icon", {state: "visible"});
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

