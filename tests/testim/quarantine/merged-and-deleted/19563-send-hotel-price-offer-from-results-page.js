/*
 * Test Name: 19563 send hotel price offer from results page
 * Description: send price offer from cart
 * Status: Quarantine
 * Labels: Fit for Prod
 * Owner: pini harush
 * Created: 2022-12-13T01:29:17Z
 * Updated: 2024-09-22T11:38:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await LOG_IN('test@io.com');
  await page.click("[title='Book a New Trip'] .material-symbols-outlined");
  await page.click(".traveler-name");
  await page.click(".imt-btn");
  await Search_for_hotel_1_night('LON');
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click(".hotel-list-sort .material-symbols-outlined");
  await page.click(".hotel-list > :nth-child(1) .see-availability-btn");
  await waitForText(page, "#tab-amenities", 'Amenities');
  await filter_by_refundable_hotel();
  await waitForText(page, ".room-list > :nth-child(2) .is-hidden-mobile", 'Price details');
  await page.click(".room-list > :nth-child(2) .share-btn");
  await waitForText(page, ".has-text-primary", /Added/);
  await page.click(".share-bar .share-btn");
  await waitForText(page, "[aria-label='Share Quotes'] > div:nth-of-type(1) .el-dialog__title", 'Share Quotes');
  await page.click("[valuekey='value']");
  await page.type("[valuekey='value']", 'test@test.io');
  await page.click("h2");
  await page.click("body > :nth-child(15) .btn--primary");
  await waitForText(page, "#ObNMFSir > p", 'Sent successfully');
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
}

function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}


// shared steps \\
async function LOG_IN(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_for_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function filter_by_refundable_hotel() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

