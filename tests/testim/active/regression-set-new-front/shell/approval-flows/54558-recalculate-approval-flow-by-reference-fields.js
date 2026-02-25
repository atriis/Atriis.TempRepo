/*
 * Test Name: 54558 Recalculate approval flow by reference fields
 * Description: 
 * Status: Active
 * Labels: Regression,Reference Fields,Approval flow,Daily Shell,2026 plan 1
 * Owner: pini harush
 * Created: 2024-11-21T12:27:09Z
 * Updated: 2025-12-10T09:36:50Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@approval.ref');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_manual_quote();
  await page.click(".btn-container span");
  await Recalculate_app_flow_by_RF_and_link_RF();
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

async function Add_manual_quote() {
  await page.click(".is-capitalized");
  await page.click("[id='tab-manualOtherProducts'] p");
  await waitForText(page, "#pane-manualOtherProducts > section > form > div:nth-child(1) > div:nth-child(1) > label", /Select quote type/);
  await page.click("[id='pane-manualOtherProducts'] .manual-quote-form > :nth-child(1) [set='[object Object]'] [fill='currentColor']");
  await page.click("#el-id-8923-756 > span");
  await page.click("#el-id-8923-979");
  await page.click("[id='el-id-8923-792'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-8923-980");
  await page.click("[id='el-id-8923-793'] tbody > :nth-child(4) > td:nth-of-type(6) .el-date-table-cell__text");
  await page.click("#el-id-8923-984");
  await page.type("#el-id-8923-984", '567');
  await page.click(".add-quote-btn");
  await page.click("body > :nth-child(19) .btn--primary");
}

async function Recalculate_app_flow_by_RF_and_link_RF() {
  await waitForText(page, ".general-section .label", 'Recalculate Approval Flow');
  await waitForText(page, "[class^='btn--width'], [class*=' btn--width']", /(Book and Finalize)|(Finalize)/);
  await page.click("[id='el-collapse-content-3945'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8923-3361 > span");
  await waitForText(page, "[class^='btn--width'], [class*=' btn--width']", /(Submit for Approval)|(Send For Approvals)/);
  await page.click("#el-collapse-head-205 > div > span");
  await page.click("#el-collapse-head-205 > div > span");
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8923-3362");
  await waitForText(page, "[class^='btn--width'], [class*=' btn--width']", /(Book and Finalize)|(Finalize)/);
  await waitForText(page, "[id='el-collapse-content-3353'] .column > :nth-child(1) > :nth-child(2) .label", 'linked to Recalculate Approval Flow');
  await page.click("#el-collapse-head-134 > div > span");
  await page.click("#el-collapse-head-134 > div > span");
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1917-291 > span");
  await waitForText(page, "[class^='btn--width'], [class*=' btn--width']", /(Submit for Approval)|(Send For Approvals)/);
  await page.click("#el-collapse-head-349 > div > span");
  await page.click("#el-collapse-head-349 > div > span");
  await page.click("[id='el-collapse-content-349'] .column > :nth-child(1) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8923-3374 > span");
  await waitForText(page, "[class^='btn--width'], [class*=' btn--width']", /(Book and Finalize)|(Finalize)/);
}

