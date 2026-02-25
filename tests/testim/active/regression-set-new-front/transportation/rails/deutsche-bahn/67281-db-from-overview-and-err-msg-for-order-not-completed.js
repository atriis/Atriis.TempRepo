/*
 * Test Name: 67281 DB from overview and err msg for order not completed
 * Description: 1- validate the DB in cart
2- validate err msg
 * Status: Active
 * Labels: Regression,Rail,DB Rail,Cart,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-09-15T01:39:01Z
 * Updated: 2025-09-15T02:01:30Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('JSKRL@JSKRL.com');
  await page.click(".top-container > :nth-child(5) .icon-container > :nth-child(2)");
  await page.click(".trip-list > :nth-child(1) .passengers");
  await page.hover(".flicking-camera > :nth-child(4) .el-dropdown");
  await page.click("#el-id-2357-25 > li:nth-child(4) > span");
  await waitForText(page, ".app-msg-text", 'Clicking \'Continue\' will open a new booking window. After completing your booking, return to this page to see it in your Trip Overview');
  await page.click(".btn--size-large");
  await page.waitFor(6000);
  await page.click(".atrs-edit-search-drawer .btn--primary");
  await waitForText(page, "body > :nth-child(32) p", 'We\'re having trouble finding your Deutsche Bahn order.Please check that you\'ve completed all steps on the Deutsche Bahn site and try again.');
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

