/*
 * Test Name: 54438 - Premium Economy flight with connection, show oop according to settings
 * Description: Bug is back
 * Status: Draft
 * Labels: NL government,Travel policy,Search Flight
 * Owner: Noam Miller
 * Created: 2024-11-18T07:56:30Z
 * Updated: 2024-12-09T01:12:14Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('23079corp@nlgov.com');
  await book_a_new_trip();
  await Search_flights__premium_economy();
  await Validate_oop_is_not_displayed_for_lowest_fare();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function isVisible(page, selector) {
  try {
    const elementHandle = await page.$(selector);
    if(!elementHandle) {
      return false;
    }
    const elementBox = await elementHandle.boundingBox();
    return Boolean(elementBox);
  } catch(err) {
    return false;
  }
}

// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function Search_flights__premium_economy() {
  //TODO Please add an assertion here
await isVisible(page, ".flight-form > :nth-child(2) > :nth-child(1)");
  await page.click("#el-id-4536-51");
  await page.type("#el-id-4536-51", 'AMS');
  await page.click("[id='el-id-4536-33-item-0'] .ellipsis");
  await page.click("#el-id-4536-52");
  await page.type("#el-id-4536-52", 'CBR');
  await page.click("[id='el-popper-container-4536'] .has-text-weight-bold");
  await page.click("[placeholder='Depart Date']");
  await page.click(".arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.click(".class-input [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4855-42 > span");
  await page.click(".btn--primary");
}

async function Validate_oop_is_not_displayed_for_lowest_fare() {
  //TODO Please add an assertion here
await isVisible(page, ".flight-list > :nth-child(1) .price-wrapper");
  await page.click(".el-radio-group > :nth-child(2) .is-flex");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

