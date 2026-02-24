/*
 * Test Name: 47583 Request Assistance -  Reference Field order corresponds to the other that was configured in admin
 * Description: 
 * Status: Active
 * Labels: Request Assistance,Reference Fields,Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-06-20T11:23:40Z
 * Updated: 2026-02-16T02:34:47Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunaref@reffields.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Request_assistance_button();
  await Fill_out_and_send_request_form();
  await Reference_Field_order_corresponds_to_the_other_that_was_configured_in_admin();
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

async function Request_assistance_button() {
  await page.click(".page-view .icon-container");
}

async function Fill_out_and_send_request_form() {
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await page.type("#el-id-7864-325", 'lisbon');
  await page.click(".autocomplete-result");
  await page.type("#el-id-7864-326", 'tlv');
  await page.click(".autocomplete-result");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.click("#el-id-3684-335");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(3) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-7864-335");
  await page.click(".btn--size-large");
}

async function Reference_Field_order_corresponds_to_the_other_that_was_configured_in_admin() {
  await waitForText(page, ".general-questions > article:nth-of-type(1) .label", /Cost Centre/);
  await waitForText(page, ".general-questions > article:nth-of-type(2) .label", /Region Code/);
  await waitForText(page, ".general-questions > :nth-child(3) .label", /Preferred departure time/);
  await waitForText(page, ".general-questions > :nth-child(4) .label", /Preferred return time/);
  await waitForText(page, ".general-questions > article:nth-of-type(5) .label", /Booked by/);
  await waitForText(page, ".general-questions > :nth-child(6) .label", /Do you need a carry on bag?/);
  await waitForText(page, ".general-questions > :nth-child(7) .label", /Do you need a check in bag?/);
  await waitForText(page, ".inpute-checkbox .label", /Do you need a priority bording if available?/);
  await waitForText(page, ".general-questions > :nth-child(9) .label", /Do you want us to quote you for a prebooked seat?/);
  await waitForText(page, ".general-questions > article:nth-of-type(10) .label", /If traveling to a conference please provide the link/);
}

