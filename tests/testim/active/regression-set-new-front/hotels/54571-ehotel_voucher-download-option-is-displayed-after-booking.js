/*
 * Test Name: 54571 eHotel - Voucher download option is displayed after booking
 * Description: 
 * Status: Active
 * Labels: Ehotel Regression,Hotel,Voucher,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-11-22T08:28:38Z
 * Updated: 2025-01-06T12:42:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunabarbosa@bruna.com');
  await waitForText(page, "h1", /Welcome/);
  await page.goto('https://ui.gtp-staging.com/trips/3208835/cart');
  await close_mandatory_notification();
  await waitForText(page, ".app-label", 'Confirmed');
  await waitForText(page, ".download-text", 'Download Voucher');
  await waitForText(page, ".download-links > :nth-child(1)", 'English');
  await waitForText(page, ".download-links > :nth-child(2)", 'French');
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

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

