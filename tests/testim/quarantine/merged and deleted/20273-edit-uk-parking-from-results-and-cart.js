/*
 * Test Name: 20273 edit UK Parking from results and cart
 * Description: edit UK Parking from results page and cart
 * Status: Quarantine
 * Labels: 
 * Owner: pini harush
 * Created: 2022-12-13T01:29:17Z
 * Updated: 2024-01-04T11:53:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await LOG_IN('test@io.com');
  await page.click("[title='Book a New Trip'] .material-symbols-outlined");
  await page.click(".traveler-name");
  await page.click(".imt-btn");
  await page.click("[id='tab-parking'] p");
  await waitForText(page, "#pane-parking > h4", 'Book your UK parking');
  await page.click("[placeholder='Search UK Airport']");
  await page.type("[placeholder='Search UK Airport']", 'lhr');
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[placeholder='Parking from']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(2) span");
  await page.type(".form-date-section > div:nth-of-type(2) [type='text']", '13:00');
  await page.click("[placeholder='Return Date']");
  await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(5) > td:nth-of-type(3) span");
  await page.type(".form-date-section > div:nth-of-type(4) [type='text']", '16:30');
  await page.click(".el-tabs__content");
  await page.click(".search-btn");
  await waitForText(page, ".parking-list > section:nth-of-type(1) .desktop-btn", 'Add to trip');
  await page.click(".edit-search-btn");
  await page.click("[placeholder='Parking from']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(3) span");
  await page.click("[placeholder='Return Date']");
  await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(5) > td:nth-of-type(4) span");
  await page.click(".search-btn");
  await waitForText(page, ".parking-list > section:nth-of-type(1) .desktop-btn", 'Add to trip');
  await page.click(".parking-list > section:nth-of-type(1) .desktop-btn");
  await page.click(".ticket-top-section a");
  await waitForText(page, ".info-container > :nth-child(1) .section-title", 'Why book:');
  await page.click("#el-drawer__title > button > i");
  await page.click(".contact-information .is-clickable");
  await page.click("[type='number']");
  await page.type("[type='number']", '12323234');
  await page.click("[placeholder='Volkswagen']");
  await page.type("[placeholder='Volkswagen']", 'mazda');
  await page.click("[placeholder='Golf']");
  await page.type("[placeholder='Golf']", '3');
  await page.click("[placeholder='BD51 SMR']");
  await page.type("[placeholder='BD51 SMR']", '3343434');
  await page.click("[placeholder='Silver']");
  await page.type("[placeholder='Silver']", 'red');
  await page.click(".quote-card .no-border");
  await page.type("", '');
  await page.click(".delivery-pickup .is-clickable");
  await page.click(".inputs > div:nth-of-type(2) [type='text']");
  await page.type(".inputs > div:nth-of-type(2) [type='text']", '121');
  await page.click(".inputs > div:nth-of-type(3) [type='text']");
  await page.type(".inputs > div:nth-of-type(3) [type='text']", '2');
  await page.click(".inputs > div:nth-of-type(4) [type='text']");
  await page.type(".inputs > div:nth-of-type(4) [type='text']", '232');
  await page.click(".inputs > div:nth-of-type(5) [type='text']");
  await page.type(".inputs > div:nth-of-type(5) [type='text']", '3');
  await page.click(".quote-card .no-border");
  await page.type("", '');
  await page.click(".el-checkbox__inner");
  await waitForText(page, ".app-label", 'Pending Booking');
  await page.waitForSelector(".btn--primary", {state: "visible"});
  // Converting a 'wait-for-code-step' step has to be done manually at this time
  await page.click(".btn--primary");
  await page.waitForSelector(".is-hidden-mobile", {state: "visible"});
  await page.click(".cart-btn .material-symbols-outlined");
  await delete_one_and_only_qoute_from_cart_before_checkout();
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
async function LOG_IN(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function delete_one_and_only_qoute_from_cart_before_checkout() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await page.click("[aria-label='Cancel item - '] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  if (false) {
    await page.click("body > :nth-child(12) .btn--primary");
  }
  if (false) {
    await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  }
  await page.click(".close-btn");
}

