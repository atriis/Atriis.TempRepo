/*
 * Test Name: 56738 Evolvi - warning regarding class changes between legs
 * Description: as pini@gov.nl> go to 3451653> Leg 4 should show the msg
 * Status: Active
 * Labels: Regression,Rail,Evolvi,Transportation,2026 plan 1
 * Owner: pini harush
 * Created: 2025-01-14T03:13:55Z
 * Updated: 2025-06-24T10:50:27Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('pini@gov.nl');
  await waitForText(page, "h1", /Welcome/);
  await page.goto('https://ui.gtp-staging.com/trips/3451653/cart');
  await Pending_Booking___Wait_for_element_text();
  await Warning_regarding_class_is_displayed();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollToElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, selector);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Warning_regarding_class_is_displayed() {
  await waitForText(page, ".uk-rail-seats .card-title", '* Seating');
  await page.click(".uk-rail-seats .is-clickable");
  await scrollToElement(page, ".page-layout-main .el-card__body > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(2) .selection-container > :nth-child(5) [class^='p'], [class*=' p'] > :nth-child(1)");
  await waitForText(page, ".page-layout-main .el-card__body > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(2) .selection-container > :nth-child(5) [class^='p'], [class*=' p'] > :nth-child(2)", /First class ticket but reservation will be in Standard class/);
}

