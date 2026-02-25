/*
 * Test Name: HYBRID for 49309 Evolvi - Results match search criteria when system language is not English
 * Description: 
 * Status: Active
 * Labels: hybrid,Regression,results,Rail,Evolvi,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2024-08-01T12:06:51Z
 * Updated: 2025-10-30T12:36:22Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('thiagosantos@evolvi.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi__rountrip_search('bth', 'pad');
  await close_mandatory_notification();
  await Change_language_to_german();
  await Search_Evolvi__UK_Rail__round_trip('bth', 'pad');
  await Verify_german_results();
  await Change_language_back_to_english();
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

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Change_language_to_german() {
  await waitForText(page, ".results-header > :nth-child(2) .title-container h3", 'Outbound');
  await page.click(".page-view a span");
  await page.hover(".support-icon");
  await page.click("#el-tooltip-482 > div:nth-child(2)");
  await waitForText(page, ".welcome", /Willkommen zurück/);
}

async function Search_Evolvi__UK_Rail__round_trip(from, to) {
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

async function Verify_german_results() {
  await waitForText(page, ".results-header > :nth-child(2) .title-container h3", 'Hinreise');
}

async function Change_language_back_to_english() {
  await page.hover(".support-icon");
  await page.click("#el-tooltip-1401 > div:nth-child(1)");
  await waitForText(page, ".welcome", /Welcome back/);
}

