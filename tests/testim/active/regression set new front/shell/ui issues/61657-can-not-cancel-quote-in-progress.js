/*
 * Test Name: 61657 Can not cancel quote 'In Progress'
 * Description: 
 * Status: Active
 * Labels: Daily Shell,Regression,trip cancelation,2026 plan 2
 * Owner: Yael
 * Created: 2025-05-06T01:38:15Z
 * Updated: 2026-02-11T02:49:14Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('inprogress@inprogress.com');
  await page.click(".top-container > :nth-child(5) .icon-container > :nth-child(2)");
  await page.click("#el-id-9461-19");
  await page.type("#el-id-9461-19", '3520979');
  await page.click("[aria-disabled='false']");
  await page.click(".passengers");
  if (false) {
    await page.goto('https://ui-dev.gtp-staging.com/trips/3520979/cart');
  }
  await test();
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

async function test() {
  await waitForText(page, ".flight-quote-card .has-text-weight-bold", 'In progress');
  await page.hover("#el-id-5854-13 > span");
  await waitForText(page, "#el-id-286-13 > li:nth-child(2)", 'Copy trip');
  await page.hover("[id='el-id-8202-14'] .expand-icon");
  await waitForText(page, "#el-id-2886-71 > span:nth-child(1)", 'Trip cannot be canceled while you have products in progress or finalizing.');
  await page.hover("#el-id-5854-61");
  await waitForText(page, "#el-id-2159-62 > li > span.mr-2", 'Cancel item');
  await page.hover("#el-id-5854-13 > span");
  await waitForText(page, "#el-id-286-13 > li:nth-child(2)", 'Copy trip');
  await page.click("#el-id-9411-16 > li:nth-child(3) > span.mr-2");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.hover("#el-id-5854-61");
  await waitForText(page, "#el-id-2159-62 > li > span.mr-2", 'Cancel item');
  await page.click("#el-id-2272-63 > li > span.mr-2");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

