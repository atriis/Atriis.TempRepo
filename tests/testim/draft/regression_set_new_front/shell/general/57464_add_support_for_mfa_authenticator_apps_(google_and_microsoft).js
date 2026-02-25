/*
 * Test Name: 57464 Add support for MFA Authenticator Apps (Google and Microsoft)
 * Description: 
 * Status: Draft
 * Labels: Daily Shell,Regression
 * Owner: Yael
 * Created: 2025-09-08T06:42:50Z
 * Updated: 2025-09-08T06:49:47Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await page.type("#email", '');
  await page.click("#email");
  await page.type("#email", 'mark@bear.com');
  await page.click("#psw");
  await page.type("#psw", 'ImStuckInPT24!');
  await page.click("#btnSubmit");
  await page.click("[type='submit']");
  await page.setViewportSize({width: 1918, height: 857});
  await browser.close();
})();
