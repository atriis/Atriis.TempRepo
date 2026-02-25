/*
 * Test Name: 31394 new ui - corporate user without subscription and with privileges cant see the report
 * Description: corporate user without subscription to BI reports can not see the link to the BI reports even if he has the privileges "Can view corporate reports" and "can view user group reports"
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-06-07T09:57:56Z
 * Updated: 2023-12-19T08:22:25Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@perfo.com');
  await waitForText(page, "h3", 'Recently Updated');
  await waitForText(page, "h1", /Welcome/);
  // Converting a 'negative-element-validation' step has to be done manually at this time
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

