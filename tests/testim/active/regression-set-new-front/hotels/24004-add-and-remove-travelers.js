/*
 * Test Name: 24004 Add and remove travelers
 * Description: *add, remove and add again traveler (booker)
* validate buttons :I'm the traveler and "add guest"
* use primary
 * Status: Active
 * Labels: Regression,No Amadeus Hotel Book,never failed,2026 plan 1
 * Owner: pini harush
 * Created: 2022-12-12T03:15:00Z
 * Updated: 2026-02-16T03:03:13Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await LOG_IN('test@io.com');
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
  await page.click(".imt-btn");
  await waitForText(page, ".traveler-name", 'Alex Smith');
  await page.click(".btn--default .material-symbols-outlined");
  await page.click(".imt-btn");
  await waitForText(page, ".traveler-name", 'Alex Smith');
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
async function LOG_IN(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

