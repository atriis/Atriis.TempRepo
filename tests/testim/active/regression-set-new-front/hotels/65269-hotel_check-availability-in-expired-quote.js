/*
 * Test Name: 65269 hotel - check availability in expired quote
 * Description: 
 * Status: Active
 * Labels: Hotel,Expedia,Regression,Expiry,Check price,Cart,2026 plan 2
 * Owner: Shani Hadar
 * Created: 2025-08-03T01:28:36Z
 * Updated: 2025-08-03T02:07:19Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('edi@yahot.com');
  await page.goto('https://ui.gtp-staging.com/trips/3524659/cart');
  await waitForText(page, ".app-columns [class^='is-flex-gap'], [class*=' is-flex-gap']", 'Expired');
  await validate_buttons();
  await page.click(".check-price-btn");
  await validate_text_on_check_availability_pop_up();
  await waitForText(page, "body > :nth-child(19) .title", /(Price is still available)|(No availability)/);
  await validate_text_if_available();
  await validate_text_if_no_availability();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function validate_buttons() {
  await waitForText(page, ".check-price-btn", 'Check availability');
  await waitForText(page, ".delete-btn", 'Remove quote');
}

async function validate_text_on_check_availability_pop_up() {
  await waitForText(page, ".el-dialog__title", 'Price check');
  await waitForText(page, "body > :nth-child(19) .sub-title", 'Please wait while we are checking if price is still available for:');
  await waitForText(page, ".flight-item > :nth-child(2)", 'Expired');
}

async function Verify_two_numbers_are_equal() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, "")); 
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = Math.abs(firstNumberParseFloat - secondNumberParseFloat) <= tolerance;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
  });
}

async function Verify_two_numbers_are_equal_with_tolerance(firstValue, secondValue, tolerance) {
  await Verify_two_numbers_are_equal();
}

async function validate_price_is_the_same() {
  if (true) {
    return;
  }
  //TODO Please add an assertion here
await getText(page, ".updated-price");
  await Verify_two_numbers_are_equal_with_tolerance(362.97, priceInPopUp, 0.01);
}

async function validate_text_if_available() {
  if (await getText(page, "body > :nth-child(19) .title") !== "'Price is still available'") {
    return;
  }
  await waitForText(page, "body > :nth-child(19) .sub-title", 'Price for the following item is available.');
  await waitForText(page, ".is-success", 'Pending Booking');
  await waitForText(page, ".proceed-btn", 'Proceed');
  await validate_price_is_the_same();
}

async function validate_text_if_no_availability() {
  if (await getText(page, "body > :nth-child(19) .title") !== "'No availability'") {
    return;
  }
  await waitForText(page, "body > :nth-child(19) .title", 'No availability');
  await waitForText(page, "body > :nth-child(19) .sub-title", 'Price for the following item is no longer available. you can search alternative hotel.');
  await waitForText(page, ".flight-item > :nth-child(2)", 'Expired');
}

