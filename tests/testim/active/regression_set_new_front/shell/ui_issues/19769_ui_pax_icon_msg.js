/*
 * Test Name: 19769 UI- pax icon msg
 * Description: Testing the icon message in add traveler.
 * Status: Active
 * Labels: Adding Passengers,Regression,No Amadeus Hotel Book,Fit for Prod,never failed,2026 plan 1
 * Owner: pini harush
 * Created: 2022-12-13T01:29:17Z
 * Updated: 2025-05-12T09:50:29Z
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
  //TODO Please add an assertion here
await isVisible(page, ".travelers-list");
  await page.click(".traveler-name");
  //TODO Please add an assertion here
await isVisible(page, ".checkbox-container");
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function isVisible(page, selector) {
  try {
    const elementHandle = await page.$(selector);
    if(!elementHandle) {
      return false;
    }
    const elementBox = await elementHandle.boundingBox();
    return Boolean(elementBox);
  } catch(err) {
    return false;
  }
}

// shared steps \\
async function LOG_IN(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

