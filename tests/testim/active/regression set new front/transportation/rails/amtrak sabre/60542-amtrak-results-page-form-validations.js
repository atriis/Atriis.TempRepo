/*
 * Test Name: 60542 Amtrak results page form validations
 * Description: Amtrak results  validations
 * Status: Active
 * Labels: search,Regression,Amtrak Sabre,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-04-03T11:58:22Z
 * Updated: 2025-12-22T10:16:49Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bar@amtrak.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Copy_of_New___Amtrak_search_round_trip();
  await If_ref_field();
  await Share_q_from_results();
  await page.click(".share-bar .is-clickable");
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--primary", 'Select');
  await page.click(".amtrak-list > :nth-child(1) .no-padding");
  await waitForText(page, "body > :nth-child(22) [target='_blank']", 'Supplier Terms & Conditions');
  await page.click("body > :nth-child(22) [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".amtrak-list > :nth-child(1) [hassabreresults='true']");
  await waitForText(page, ".classes-card .mb-4", 'Available Classes And Fares');
  await page.click("[aria-label='More details'] .btn");
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--primary", 'Select');
  await waitForText(page, ".btn--secondary", 'Change');
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".btn--primary", 'Add to trip');
  await page.click(".btn--primary");
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

async function Copy_of_New___Amtrak_search_round_trip() {
  await page.click(".el-tabs__header .el-select__wrapper");
  await page.click("#el-id-7569-23 > span");
  //TODO Please add an assertion here
await isVisible(page, ".amtrak-form-container");
  await page.click("#el-id-6985-370");
  await page.type("#el-id-6985-370", 'NYP');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-6985-374");
  await page.type("#el-id-6985-374", 'WAS');
  await page.click("[id='el-id-6985-325-item-0'] p");
  await page.click("#el-id-6985-371");
  await page.click("[id='el-id-7568-295'] tbody > tr:nth-of-type(7) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-6985-375");
  await page.click("[data-popper-placement='top'] tbody > tr:nth-of-type(7) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function If_ref_field() {
  await page.click("#el-id-5215-478");
  await page.click("#el-id-5215-476");
  await Click_on_proceed_after_search();
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function Share_q_from_results() {
  await page.click(".results-top-section .material-symbols-outlined");
  await waitForText(page, ".pair-btn", 'Next city pair');
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--default", /Added/);
  await page.click(".pair-btn");
  await waitForText(page, ".amtrak-list > :nth-child(1) .no-padding", 'Fare Rules');
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".has-text-primary", /Added/);
  await page.click(".is-hidden-mobile");
  await waitForText(page, "body > :nth-child(23) .mb-4", 'Include in price offer');
  await waitForText(page, ".em_side_space > :nth-child(1) > :nth-child(2) > :nth-child(8) [bgcolor='#1C73FF'] tr > :nth-child(1) [ng-switch-when='true']", /Train Offer/);
  await page.click("body > :nth-child(23) .btn--primary");
  await Success_toast_alert();
}

