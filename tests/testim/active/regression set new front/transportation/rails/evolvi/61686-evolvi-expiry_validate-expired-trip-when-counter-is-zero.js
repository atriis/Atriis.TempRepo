/*
 * Test Name: 61686 Evolvi> expiry - validate expired trip when counter is zero
 * Description: validate expired trip when counter is zero
 * Status: Active
 * Labels: Regression,Rail,Evolvi,Expiry,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-05-06T04:44:14Z
 * Updated: 2025-09-12T10:17:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('corp@Evolvi.com');
  await Navigate_to_specific_trip_and_check__Expired__status();
  await __Delete__button_is_displayed_and_click__Search_again_();
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

async function Navigate_to_specific_trip_and_check__Expired__status() {
  await page.goto('https://ui.gtp-staging.com/trips/3487993/cart');
  await waitForText(page, ".app-columns [class^='is-flex-gap'], [class*=' is-flex-gap']", 'Expired');
}

async function __Delete__button_is_displayed_and_click__Search_again_() {
  await waitForText(page, ".btn--secondary", 'Remove quote');
  await waitForText(page, ".desktop-btn", 'Search again');
  await page.click(".desktop-btn");
}

