/*
 * Test Name: 34400 Evolvi - It is possible to select a return
 * Description: 
 * Status: Active
 * Labels: Regression,results,Rail,Evolvi,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-06-05T11:48:31Z
 * Updated: 2025-06-08T12:33:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com/");
  await Login('eve@levi.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi__rountrip_search('OXF', 'WIN');
  await Mandatory_notifications();
  await waitForText(page, ".selected-prices > div:nth-of-type(1) p", 'Select outbound');
  await page.click("[aria-describedby='el-tooltip-1035'] .amount");
  await scrollToElement(page, ".focusing");
  await page.click(".focusing");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  //TODO Please add an assertion here
await getText(page, ".results-header > :nth-child(3) .trains-info-container > :nth-child(2) > :nth-child(2)");
  await page.waitFor(500);
  await waitForText(page, ".selected-prices > :nth-child(2) p", new RegExp("Inbound: "+hour));
  if (false) {
    await waitForText(page, ".selected-prices > div:nth-of-type(2) p", new RegExp("Inbound:                        "+hour));
  }
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

async function UK_Rail__Evolvi__rountrip_search(from, to) {
  await page.click(".el-tabs__header .el-input");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.waitFor(1000);
  await page.type("[aria-activedescendant^='el-autocomplete']", from);
  await sendSpecialCharacter(page, "#el-id-4295-1096", 'Tab');
  await page.click("[id='pane-rails'] [placeholder='Depart Date']");
  await page.dblclick(".el-zoom-in-top-enter-from [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9009-999'] tbody > :nth-child(3) > :nth-child(7)");
  await page.type("[aria-activedescendant='el-autocomplete-9190-item--1']", to);
  await sendSpecialCharacter(page, "#el-id-4295-1101", 'Tab');
  await page.click("[placeholder='Pick-up date']");
  await page.click("[id='el-id-5512-76'] tbody > :nth-child(4) > :nth-child(3)");
  await page.waitForSelector("[id^='el-id']", {state: "visible"});
  if (await isVisible(page, "form > :nth-child(4) > :nth-child(3) .el-checkbox__inner")) {
    await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  }
  await page.click(".search-btn");
}

async function Mandatory_notifications() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

