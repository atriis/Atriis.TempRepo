/*
 * Test Name: 30630 Fill mandatory field for other corp user
 * Description: when adding user with empty mandatory field in the administration - the profile pops up, the user see an error message, can update the field, and the field updated in the administration
 * Status: Active
 * Labels: Regression,mandatory fields,Profile,Administration,Adding Passengers,never failed,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-10-22T10:12:50Z
 * Updated: 2026-02-17T06:41:03Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Mendy@Tori.com');
  await click_on_administration();
  await delete_the_mobile_from_the_administration();
  await book_a_new_trip();
  await add_traveler('roman datori');
  await validate_profile_pops_up_with_the_correct_message();
  await enter_mobile_in_the_pop_up();
  await validate_mobile_updated_in_the_administration();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function click_on_administration() {
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
}

async function delete_the_mobile_from_the_administration() {
  await waitForText(page, "[name='Name']", 'TESTIM mandatory field');
  await page.click("[title='Users']");
  await page.click(".ui-dialog-buttonset > :nth-child(1)");
  await waitForText(page, ".datatable-header tr > th:nth-of-type(2) span", 'First Name');
  await page.click("[ng-disabled='isDisabled']");
  await page.type("[ng-disabled='isDisabled']", 'Roman datori');
  await page.click("[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > :nth-child(4)");
  await page.click("[ng-class='{\'active\':activeTab == CorporateUserTabs.contectInformation}']");
  await waitForText(page, "[user='selectedUser'] > :nth-child(1) > :nth-child(1) > :nth-child(1) label", 'Mobile(Optional)');
  await page.type("[phone-number='user.Mobile'] [name='CountryCode']", '');
  await page.type("[phone-number='user.Mobile'] [name='AreaCode']", '');
  await page.type("[phone-number='user.Mobile'] .ng-pristine", '');
  await scrollToElement(page, "[data-ng-click='onSaveClicked()']");
  await page.click("[data-ng-click='onSaveClicked()']");
  await waitForText(page, ".toast-title", 'Save succeeded');
}

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function add_traveler(name) {
  await page.click(".traveler-name");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
}

async function validate_profile_pops_up_with_the_correct_message() {
  await waitForText(page, ".mandatory", 'Mobile');
  await page.click("[class^='m'], [class*=' m'] > :nth-child(2)");
  await waitForText(page, ".help", 'Invalid phone number');
  await waitForText(page, ".btns-container p", 'Please fill all required fields which are marked');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function enter_mobile_in_the_pop_up() {
  await page.type(".phone-inputs-container > :nth-child(1) [placeholder='+ (123)']", '972');
  await page.type(".phone-inputs-container > :nth-child(1) [placeholder='50']", '50');
  await page.type(".is-danger [type='text']", '8521478');
  await page.click("[class^='m'], [class*=' m']");
  await Success_toast_alert();
}

async function validate_mobile_updated_in_the_administration() {
  await page.click("[title='Roles']");
  await waitForText(page, ".datatable-header tr > :nth-child(1) span", 'Role');
  await page.click("[title='Users']");
  await page.click("[ng-disabled='isDisabled']");
  await page.type("[ng-disabled='isDisabled']", 'Roman datori');
  await page.click("[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > :nth-child(4) .ng-binding");
  await page.click("[ng-class='{\'active\':activeTab == CorporateUserTabs.contectInformation}']");
  await waitForText(page, "[phone-number='user.Mobile'] [name='CountryCode']", '972');
  await waitForText(page, "[phone-number='user.Mobile'] [name='AreaCode']", '50');
  await waitForText(page, "[phone-number='user.Mobile'] [name='Number']", '8521478');
}

