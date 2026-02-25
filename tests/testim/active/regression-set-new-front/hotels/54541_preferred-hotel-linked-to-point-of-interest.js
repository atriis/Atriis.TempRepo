/*
 * Test Name: 54541 - Preferred Hotel linked to Point of Interest
 * Description: 
 * Status: Active
 * Labels: Club,Hotel,Preferred Hotels,search,Regression,Point of interest,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-11-21T06:58:46Z
 * Updated: 2025-09-14T09:35:59Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('poiCorp@club.com');
  await book_a_new_trip();
  await Search_hotel_by_poi();
  await Validate_preferred_hotels();
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

async function Search_hotel_by_poi() {
  await waitForText(page, ".hotel-search-cmp > :nth-child(2) > :nth-child(2) .el-select__selection span", '1 Room');
  await page.click("#el-id-2790-43");
  await page.click("#el-id-2790-26-item-0 > div");
  await page.click("[placeholder='Check in']");
  await page.click(".arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".is-right tbody > :nth-child(3) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Validate_preferred_hotels() {
  await waitForText(page, ".hotel-list > :nth-child(1) .btn--primary", 'View rates');
  //TODO Please add an assertion here
await isVisible(page, ".hotel-list > :nth-child(1) .app-badge");
  await waitForText(page, ".hotel-list > :nth-child(1) .ticket-img .is-align-items-center", /CORPORATE PREFERRED/);
  //TODO Please add an assertion here
await isVisible(page, ".hotel-list > :nth-child(2) .badge-wrapper > :nth-child(1) .is-align-items-center");
  await waitForText(page, ".hotel-list > :nth-child(1) .hotel-name", /(Beverly Hills Marriott)|(The Tangerine - A Burbank Hote)/);
  await waitForText(page, ".hotel-list > :nth-child(2) .ellipsis-txt", 'The Tangerine - A Burbank Hotel');
}

