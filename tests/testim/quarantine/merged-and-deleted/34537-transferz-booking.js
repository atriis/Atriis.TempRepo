/*
 * Test Name: 34537 Transferz> booking
 * Description: book Transferz ground service
 * Status: Quarantine
 * Labels: 
 * Owner: pini harush
 * Created: 2023-08-17T08:54:16Z
 * Updated: 2023-11-29T09:50:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('TRANSFERZ@testim.com');
  await book_a_new_trip();
  await search_Transferz_LHR_emirates();
  await page.click(".desktop-btn");
  await scrollToElement(page, ".contact-information .is-clickable");
  await GS__add_phone();
  await page.click(".el-checkbox__inner");
  await page.waitFor(3000);
  await page.click(".btn-container span");
  await waitForText(page, ".is-hidden-mobile", /Book and Finalize/);
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__title", 'Success');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='ml'], [class*=' ml']", /(In Progress)|(Ticketed)|(Confirmed)/);
  await page.click("[class^='py'], [class*=' py']");
  await waitForText(page, ".el-dialog__body span", /To access the full terms and conditions/);
  await page.click("body > :nth-child(12) .el-dialog__close");
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function search_Transferz_LHR_emirates() {
  await page.type("[popperclass='app-autocomplete-popper ']", 'lhr');
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", 'emirates sta');
  await page.click("[id='el-autocomplete-8070-item-0'] p");
  await page.click("[placeholder='Today']");
  await page.click(".el-date-table tbody > tr:nth-of-type(7) > td:nth-of-type(5) span");
  await page.click("[placeholder='Pick-up time']");
  await page.click(".time-select .el-scrollbar__view > :nth-child(1)");
  await page.click("[placeholder='Vehicle Type']");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".details-container > :nth-child(2) > :nth-child(2) .el-input");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".details-container > :nth-child(2) > :nth-child(3) .el-select__caret");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click(".search-btn");
  await waitForText(page, ".provider-name", 'Transferz');
}

async function GS__add_phone() {
  await page.click(".contact-information .is-clickable");
  await page.click("[maxlength='3']");
  await page.type("[maxlength='3']", '1');
  await page.click(".control > div:nth-of-type(2) [type='number']");
  await page.type(".control > div:nth-of-type(2) [type='number']", '220');
  await page.click(".control > div:nth-of-type(3) [type='number']");
  await page.type(".control > div:nth-of-type(3) [type='number']", '4445566');
  await page.click(".tabs-container .no-border");
}

