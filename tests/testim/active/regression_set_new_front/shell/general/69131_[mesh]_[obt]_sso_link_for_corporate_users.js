/*
 * Test Name: 69131 [MESH] [OBT] SSO link for corporate users
 * Description: 
 * Status: Active
 * Labels: Daily Shell
 * Owner: Yael
 * Created: 2025-10-21T11:59:18Z
 * Updated: 2025-10-21T12:01:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com/");
  await Login("supp@atriis.com");
  await page.click(".top-container > :nth-child(7) .icon-container > :nth-child(2)");
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

