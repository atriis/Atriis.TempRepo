/*
 * Test Name: 23072 Request Assistance of hotel, car and EU rail
 * Description: Request Assistance of hotel, car and EU rail
 * Status: Quarantine
 * Labels: Fit for Prod
 * Owner: pini harush
 * Created: 2023-01-31T02:07:56Z
 * Updated: 2024-02-11T07:04:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('pini@gov2.nl');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Request_assistance__hotel('London,United Kingdom,(LON)');
  await waitForText(page, "[valuekey='value']", 'London,United Kingdom,(LON)');
  await page.type("[placeholder='Comment (Optional)']", 'bla bla 2');
  await page.click(".btns-list > :nth-child(2) .icon-text");
  await Request_assistance__car();
  await page.click(".btns-list > :nth-child(3) .icon-text");
  await Request_assistance__euRail();
  await page.click(".btn--primary");
  await page.type("[id='el-collapse-content-5376'] .is-danger [type='text']", '123');
  await page.click(".financial-section [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("body > :nth-child(17) .btn--primary");
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[idx='0'] .active", 'bla bla 2');
  await waitForText(page, "[idx='1'] .active", 'carrr 3');
  await waitForText(page, "[idx='2'] .active", 'railll4');
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Request_assistance__hotel(destination) {
  await page.click("#tab-hotel > div");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", destination);
  await page.waitFor(1000);
  await sendSpecialCharacter(page, "#el-id-7300-759", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(3)");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(4)");
  await page.click(".btn--default");
}

async function Request_assistance__car(param) {
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", 'madrid');
  await page.click("[id='el-autocomplete-2486-item-1'] .has-text-weight-bold");
  await page.click("[placeholder='Pick-up Date']");
  await page.dblclick("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(5) span");
  await page.click("[placeholder='Drop-off Date']");
  await page.click("[x-placement='top-start'] .el-date-table tbody > :nth-child(5) > td:nth-of-type(6) span");
  await page.click("[placeholder='Pick-up Time']");
  await scrollToElement(page, ".time-select .el-scrollbar__view > :nth-child(42)");
  await page.click(".time-select .el-scrollbar__view > :nth-child(42)");
  await page.click("[placeholder='Drop-off Time']");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > :nth-child(90)");
  await page.click(".request-assistance-main > :nth-child(3) [placeholder='Comment (Optional)']");
  await page.type(".request-assistance-main > :nth-child(3) [placeholder='Comment (Optional)']", 'carrr 3');
}

async function Request_assistance__euRail() {
  await page.type("[placeholder='From... Station or Location']", 'bruss');
  await page.click("[id='el-autocomplete-7369-item-0'] p");
  await page.type("[placeholder='To... Station or Location']", 'paris');
  await page.click("[id='el-autocomplete-2372-item-0'] p");
  await page.click(".from-row [placeholder='Date']");
  await page.click("[x-placement='bottom-start'] [aria-label='Next Month']");
  await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(5) > td:nth-of-type(4) span");
  await page.click(".to-row [placeholder='Date']");
  await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(5) > td:nth-of-type(5) span");
  await page.click(".request-assistance-main > :nth-child(4) [placeholder='Comment (Optional)']");
  await page.type(".request-assistance-main > :nth-child(4) [placeholder='Comment (Optional)']", 'railll4');
}

