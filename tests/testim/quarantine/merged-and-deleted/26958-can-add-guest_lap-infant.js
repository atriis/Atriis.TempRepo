/*
 * Test Name: 26958 can add guest - lap infant
 * Description: the user can add lap infant (guest), birth date relevant to lap infant, lap infant tag, cant proceed to search (error message appears), can continue with request assistance
 * Status: Quarantine
 * Labels: Fit for Prod
 * Owner: Shani Hadar
 * Created: 2023-03-23T07:27:20Z
 * Updated: 2024-02-11T07:02:38Z
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
  await add_guest___lap_infant_Rotem_Israeli();
  await validations();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function add_guest___lap_infant_Rotem_Israeli() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click("body > :nth-child(11) [placeholder='Select']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(5) span");
  await page.click("[placeholder='Mr.']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.type("[placeholder='First Name']", 'Rotem');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '08/02/1986');
  await page.click("[placeholder='Enter email address']");
  await waitForText(page, ".help", 'Invalid date format');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '02/01/2023');
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'rotem@israeli.com');
  await waitForText(page, "[placeholder='DD/MM/YYYY']", '02/01/2023');
  await page.click(".add-guest-btn");
}

async function validations() {
  await waitForText(page, ".ptc-text-style", 'Lap Infant');
  await waitForText(page, ".max-width-text-PTC > :nth-child(2)", /Online searches are currently available for adults only. For different user types please use/);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".page-view .icon-container");
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await waitForText(page, ".ptc-text-style", 'Lap Infant');
}

