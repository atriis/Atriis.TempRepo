/*
 * Test Name: 36297 Limited admin works as expected
 * Description: 
 * Status: Active
 * Labels: Regression,Administration,limited admin,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-02-12T10:25:59Z
 * Updated: 2025-02-12T11:17:09Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunatailita@bruna.com');
  await page.click(".expense-container .material-symbols-outlined");
  await page.click("[data-ng-click='onAddNewUserClicked()'] span");
  await waitForText(page, "[name='newCorporateUserForm'] > :nth-child(2) > :nth-child(1) .block-display", 'First Name:');
  await page.click("#popUpCloseBtn > div");
  await page.type("[ng-disabled='isDisabled']", 'Morrissey Smith');
  await page.click("[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > :nth-child(3)");
  await waitForText(page, "[name='Employee number'] .bold", 'Employee number                                                                                                                                                                                                                                        (Optional)');
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("#question_6731", randomValue);
  await page.click("[data-ng-click='onSaveClicked()']");
  await waitForText(page, ".toast-title", 'Save succeeded');
  await waitForText(page, ".admin-search-bar > :nth-child(3)", 'Active');
  await page.click("[data-ng-class='{searchClearIcon: searchText != \'\', searchBoxSearchIcon: searchText == \'\'}']");
  //TODO Please add an assertion here
await isElementChecked(page, "[data-ng-model='showInactive']");
  //TODO Please add an assertion here
await isElementChecked(page, "[data-ng-model='showActive']");
  await Validating_only_active_users_when_filtering_by_active();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
  }, selector);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function Validating_only_active_users_when_filtering_by_active() {
  await waitForText(page, ".user-scroll-corporate tbody > :nth-child(1) > :nth-child(9)", /Active/);
}

