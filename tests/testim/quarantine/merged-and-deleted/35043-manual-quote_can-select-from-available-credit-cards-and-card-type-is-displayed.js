/*
 * Test Name: 35043 Manual Quote - Can select from available credit cards and card type is displayed
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-08-24T02:46:28Z
 * Updated: 2023-12-19T04:29:46Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunasantos@manualquote.com');
  await book_a_new_trip();
  await page.click(".is-capitalized");
  await Add_traveler___I_am_the_traveler();
  await page.click("[id='tab-car'] p");
  await scrollToElement(page, "[id='pane-car'] .payment-details-section > :nth-child(1) .el-select__caret");
  await page.click("[id='pane-car'] .payment-details-section > :nth-child(1) .el-select__caret");
  await waitForText(page, "[x-placement='bottom-start'] span", 'testim one');
  await page.click("[x-placement='bottom-start'] .el-select-dropdown__item");
  await waitForText(page, "[id='pane-car'] [placeholder='Select type']", 'Visa Credit');
  await page.click("[id='pane-car'] [placeholder='Select type']");
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1) [class^='px'], [class*=' px']", 'MasterCard');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(2) [class^='px'], [class*=' px']", 'American Express');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(3) [class^='px'], [class*=' px']", 'Diners Club');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(5) [class^='px'], [class*=' px']", 'Discover');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(4) [class^='px'], [class*=' px']", 'Visa Credit');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(6) [class^='px'], [class*=' px']", 'Air Plus');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(7) [class^='px'], [class*=' px']", 'EHotel');
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function refresh_tab_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await page.reload();
}

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

