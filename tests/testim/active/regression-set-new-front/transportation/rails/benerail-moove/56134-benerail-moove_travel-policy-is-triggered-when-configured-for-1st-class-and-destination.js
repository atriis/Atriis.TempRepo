/*
 * Test Name: 56134 Benerail Moove - Travel Policy is triggered when configured for 1st class and destination
 * Description: 
 * Status: Active
 * Labels: Benerail Moove Regression,Travel policy,Rail,OOP,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-12-31T01:49:08Z
 * Updated: 2025-09-01T06:16:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('justinbieber@benerailmoovenlgov.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_benerail_by_place_one_way__direct_only_('BELEU', 'BEABC');
  await click_on_proceed_after_search();
  await Travel_Policy_is_triggered_when_configured_for_1st_class_and_destination();
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

async function Search_benerail_by_place_one_way__direct_only_(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-2625-140");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".rail-info-column > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6089-81");
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Travel_Policy_is_triggered_when_configured_for_1st_class_and_destination() {
  await scrollToElement(page, ".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await page.click(".rail-list > :nth-child(1) .muliBold");
  await waitForText(page, ".alternative-description > :nth-child(1)", /1st Class/);
  //TODO Please add an assertion here
await isVisible(page, ".app-out-of-policy .material-symbols-outlined");
  await page.hover(".app-out-of-policy .material-symbols-outlined");
  await waitForText(page, "#el-id-8293-259 > ul > li", 'Origin is be and Destination is within country and Class Of Service is  first');
}

