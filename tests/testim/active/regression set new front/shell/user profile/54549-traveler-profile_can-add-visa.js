/*
 * Test Name: 54549 Traveler Profile - Can add visa
 * Description: 
 * Status: Active
 * Labels: Profile,Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-11-19T06:42:07Z
 * Updated: 2025-09-14T09:36:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('danrogers@amadeusdanrogers.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Navigating_to__Passport_and_Visa__profile_page();
  await Adding_visa();
  await Deleting_visa();
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

async function Navigating_to__Passport_and_Visa__profile_page() {
  await page.click(".traveler-name");
  await waitForText(page, ".user-profile-title p", 'Your profile settings');
  await page.click("[id='tab-passportsAndVisas'] p");
}

async function Adding_visa() {
  await page.click(".passport-inputs .btn");
  await page.click(".visa-inputs-container [d='M831.872 340.864 512 652.672 192.128 340.864a30.592 30.592 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.592 30.592 0 0 0-42.752 0z']");
  await page.click("[id*='el-id']");
  await page.click("[id*='el-id']");
  await page.click("[data-popper-placement='top'] [aria-label='Next Year'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[data-popper-placement='top'] [aria-label='Next Year'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[data-popper-placement='top'] [aria-label='Next Year'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("[id^='el-id']", '123456');
  await page.click(".btn--primary > :nth-child(2)");
  await waitForText(page, ".el-notification__title", 'Success');
}

async function Deleting_visa() {
  await page.click(".visa-inputs-container .remove-btn");
  await waitForText(page, "body > :nth-child(13) p", 'This item will be deleted. Are you sure?');
  await page.click("body > :nth-child(13) .btn--primary");
  await page.click(".btns-container .btn > :nth-child(2)");
  await waitForText(page, ".el-notification__title", 'Success');
}

