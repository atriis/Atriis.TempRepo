/*
 * Test Name: 25512 can switch back to the old UI
 * Description: user can click on "switch back to the old UI", and get to gtp
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-02-16T02:08:33Z
 * Updated: 2023-05-07T11:19:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@sab.com');
  await waitForText(page, "h1", 'Welcome Shani Sab');
  await page.click("[class^='p'], [class*=' p'] span");
  await waitForText(page, "[ng-show='tripsViewMode==3'] > :nth-child(2)", 'Welcome on Board!');
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

