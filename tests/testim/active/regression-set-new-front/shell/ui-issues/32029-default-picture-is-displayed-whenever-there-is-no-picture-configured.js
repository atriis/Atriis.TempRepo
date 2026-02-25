/*
 * Test Name: 32029 Default picture is displayed whenever there is no picture configured
 * Description: 
 * Status: Active
 * Labels: Regression,Quick Links,No Amadeus Hotel Book,never failed,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-06-16T09:18:18Z
 * Updated: 2023-06-16T09:26:24Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("testim@Quick.link");
  await page.hover("[aria-describedby='el-tooltip-9944']");
  //TODO Please add an assertion here
await isVisible(page, ".el-card__body > :nth-child(1) [draggable='true']");
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
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

