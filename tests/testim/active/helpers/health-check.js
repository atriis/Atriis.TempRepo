/*
 * Test Name: Health Check
 * Description: 
 * Status: Active
 * Labels: Helper,Health
 * Owner: Unassigned
 * Created: 2023-01-23T06:47:54Z
 * Updated: 2023-01-23T06:51:10Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://2.gtp-staging.com/NewProbe/SmartProbe");
  // Converting a 'network-validation-step' step has to be done manually at this time
  await browser.close();
})();
