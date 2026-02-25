/*
 * Test Name: 31371 new ui - corporate user with subscription and with privilege "can view corporate reports" can see the report 
 * Description: corporate user with subscription to BI reports and with privilege "Can view corporate reports" can see the link to the BI reports 
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-06-07T09:57:56Z
 * Updated: 2023-12-19T08:23:55Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await page.click("[title='Reports'] .material-symbols-outlined");
  await waitForText(page, "[title='Corporate']", 'Corporate');
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

