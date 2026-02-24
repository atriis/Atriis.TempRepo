/*
 * Test Name: 55667 can't search from cart and search page in case of  locked trip
 * Description: 
 * Status: Active
 * Labels: search,Rail,Cart,locked trip,Regression,Pre Prod,Daily Shell,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-12-19T10:30:28Z
 * Updated: 2025-03-03T05:51:25Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('uzi@yonon.com');
  await go_to_trip_3377196__confirmed_rail_in_the_past_();
  await validate_can_t_search_from_cart_page();
  await validate_message_appears();
  await validate_can_t_search_from_search_page();
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

async function go_to_trip_3377196__confirmed_rail_in_the_past_() {
  await page.goto('https://ui.gtp-staging.com/trips/3377196/cart');
}

async function validate_can_t_search_from_cart_page() {
  await waitForText(page, "[islastquote='false'] .app-label", 'Confirmed');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function validate_message_appears() {
  await waitForText(page, "[class^='pt'], [class*=' pt']", 'Adding new products or making changes is no longer possible for completed trips. To add products, please Start a New Trip');
}

async function validate_can_t_search_from_search_page() {
  await page.goto('https://ui.gtp-staging.com/trips/3377196');
  await waitForText(page, "[id='el-id-9447-49'] > :nth-child(1) .el-radio__label", 'Round trip');
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

