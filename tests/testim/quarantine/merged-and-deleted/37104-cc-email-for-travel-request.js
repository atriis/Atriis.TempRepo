/*
 * Test Name: 37104 cc email for travel request
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-11-16T01:58:44Z
 * Updated: 2023-12-12T12:50:31Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await send_request_assistance();
  await validate_cc_email(generatedEmail, 'shaninl@atriis.com');
  await validate_cc_email_1();
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

async function send_request_assistance() {
  await Request_assistance_button();
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", 'lon');
  await page.click("[id='el-autocomplete-7653-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", 'par');
  await page.click("[id='el-autocomplete-871-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-icon-arrow-right");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(4) span");
  await page.click(".end-date span");
  await page.click("[placeholder='Send CC Email (optional)']");
  // Converting a 'email-generator' step has to be done manually at this time
  await page.type("[placeholder='Send CC Email (optional)']", generatedEmail);
  await page.click(".btn--primary");
  await page.click(".financial-section [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("[name='Soort reis/Type of trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("body > :nth-child(14) .btn--primary");
}

async function validate_cc_email(expectedCcAdress, expectedToAdress) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function validate_cc_email_1() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

