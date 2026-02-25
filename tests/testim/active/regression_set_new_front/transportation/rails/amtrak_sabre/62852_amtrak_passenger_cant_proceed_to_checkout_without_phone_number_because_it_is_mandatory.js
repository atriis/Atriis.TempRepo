/*
 * Test Name: 62852 Amtrak - Passenger can't proceed to checkout without phone number because it is mandatory
 * Description: 
 * Status: Active
 * Labels: Amtrak Sabre,Rail,Regression,phone number,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-30T03:17:39Z
 * Updated: 2025-12-23T04:01:02Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('bar@amtrak.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await New_search_Amtrak_one_way('WAS', 'BOS');
  await Trip_reference_fields_after_search();
  await Copy_of_Add_Benerail_one_way_from_search_results_to_cart();
  await __Contact_information__is_mandatory_when_user_does_not_have_phone_number_configured();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
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

async function New_search_Amtrak_one_way(fromStation, toStation) {
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Trip_reference_fields_after_search() {
  await page.click(".el-collapse-item__wrap [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1044-415 > span");
  if (false) {
    await page.type("#el-id-766-703", 'business');
  }
  await Click_on_proceed_after_search();
}

async function Copy_of_Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--primary", 'Select');
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Copy_of_Add_Benerail_one_way_from_search_results_to_cart() {
  await Copy_of_Benerail___Results___Wait_for__Select__text();
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await page.click(".btn--primary");
  await Pending_booking___wait_for_element_text();
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function __Contact_information__is_mandatory_when_user_does_not_have_phone_number_configured() {
  await waitForText(page, ".el-tabs .card-title", '* Contact Information');
  await page.click(".ticket-layout-container .is-clickable");
  await waitForText(page, ".extras-card [class^='mb'], [class*=' mb']", 'Phone number');
  await waitForText(page, "#el-id-4078-323", '');
  await waitForText(page, "#el-id-4078-324", '');
  await waitForText(page, "#el-id-4078-325", '');
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await waitForText(page, ".disabled span", 'Proceed to Checkout');
  await waitForText(page, ".form-payment-err", '*In order to proceed, please add all required information');
}

