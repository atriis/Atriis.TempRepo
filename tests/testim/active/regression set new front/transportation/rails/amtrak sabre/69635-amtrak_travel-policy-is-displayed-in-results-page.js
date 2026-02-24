/*
 * Test Name: 69635 Amtrak - Travel Policy is displayed in results page
 * Description: 
 * Status: Active
 * Labels: Rail,Cart,Transportation,Amtrak Sabre,Regression,Travel policy,results,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-10-21T10:57:19Z
 * Updated: 2026-01-20T03:34:30Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('marcoluis@oopamtrak.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Amtrak_one_way('WAS', 'BOS');
  await Amtrak___Results___Wait_for__Select__text();
  await OOP_is_displayed_in_results();
  await Add_Amtrak_one_way_from_search_results_to_cart();
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

async function Book_a_new_trip() {
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

async function Search_Amtrak_one_way(fromStation, toStation) {
  await page.click(".el-tabs__header .el-input");
  await page.click("#el-id-115-24 > span");
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("#el-id-5281-108", fromStation);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.type("[placeholder='To... Station or Location']", toStation);
  await page.click("[id*='id'] p");
  await page.click("#el-id-8964-124");
  await page.click("#el-id-8964-41 > div > div > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function Amtrak___Results___Wait_for__Select__text() {
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--primary", 'Select');
}

async function OOP_is_displayed_in_results() {
  await page.click(".amtrak-list > :nth-child(1) [hassabreresults='true']");
  await page.click(".el-radio-group > :nth-child(1) .el-radio__inner");
  //TODO Please add an assertion here
await isVisible(page, "[aria-label='More details'] .shield-icon");
  await page.click(".eu-rail-app .el-overlay");
  //TODO Please add an assertion here
await isVisible(page, ".shield-icon");
  await page.hover(".info-icon");
  await waitForText(page, ".mb-1", 'Upgrade cost is greater than 5 USD');
}

async function Amtrak___Results___Wait_for__Select__text_1() {
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--primary", 'Select');
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_Amtrak_one_way_from_search_results_to_cart() {
  await Amtrak___Results___Wait_for__Select__text_1();
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".app-out-of-policy", 'shieldOut of policyinfo');
  //TODO Please add an assertion here
await isVisible(page, ".shield-icon");
  await page.hover(".info-icon");
  await waitForText(page, ".mb-1", 'Upgrade cost is greater than 5 USD');
  await page.click(".btn--primary");
  await Pending_booking___wait_for_element_text();
}

