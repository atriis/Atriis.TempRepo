/*
 * Test Name: 61598 Profile - Credit card expiration date in administration corresponds to the one added in the profile
 * Description: 
 * Status: Active
 * Labels: Profile,Regression,credit card,Administration,Expiry,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-05T08:30:16Z
 * Updated: 2025-08-20T11:15:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bruninatist@brunaadmin.com');
  await Check_if__state__and__business_number__are_displayed();
  await Adding_credit_card_in_the_profile();
  await Navigating_to_administration_to_check_that_cc_expiration_date_is_correct();
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

async function Check_if__state__and__business_number__are_displayed() {
  await waitForText(page, "h1", /Welcome/);
  await page.hover(".passenger-avatar");
  await page.click(".user-profile-link p");
}

async function Adding_credit_card_in_the_profile() {
  await page.click("[id='tab-formOfPayment'] p");
  await page.click(".add-card-btn");
  await page.type("#el-id-623-777", 'testim test');
  await page.type("#el-id-623-778", 'visa');
  await page.click("#el-id-623-498 > div");
  await page.type("#el-id-623-779", 'testim test');
  await page.click(".insert-card-btn");
  await page.type("#el-id-623-787", '4580458045804580');
  await page.click("body > :nth-child(13) .btn--primary");
  await page.type("#el-id-623-780", '02');
  await page.click("#el-id-646-513 > span");
  await page.type("#el-id-623-781", '2032');
  await page.click("#el-id-7389-533 > span");
  await page.type("#el-id-9645-782", '123 main street');
  await page.type("#el-id-9645-783", 'athens');
  await page.type("#el-id-9645-784", '75751');
  await page.type("#el-id-623-785", 'united kingdom');
  await page.click("#el-id-7389-770 > span");
  await page.click(".btn--primary > :nth-child(2)");
  await waitForText(page, ".card-name", 'testim test');
}

async function click_on_administration() {
  await page.click("[to='/'] .material-symbols-outlined");
}

async function Navigating_to_administration_to_check_that_cc_expiration_date_is_correct() {
  await click_on_administration();
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
  await page.click("[title='Users']");
  await page.type("[ng-disabled='isDisabled']", 'Brunina tist');
  await page.click("[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > :nth-child(3)");
  await waitForText(page, "[data-ng-model='user.FirstName']", 'Brunina');
  await page.click("[ng-class='{\'active\':activeTab == CorporateUserTabs.formOfPayment}']");
  await waitForText(page, "#credit-container > div:nth-child(3) > div:nth-child(1) > div:nth-child(3) > table > tbody > tr > td:nth-child(1)", 'testim test');
  await page.click("#credit-container > div:nth-child(3) > div:nth-child(1) > div:nth-child(3) > table > tbody > tr > td:nth-child(1)");
  await waitForText(page, "#s2id_autogen83 > a > span.select2-chosen", '2');
  await waitForText(page, "#s2id_autogen85 > a > span.select2-chosen", '2032');
  await page.click("[data-ng-repeat='card in userCreditCardAssociationcards | filter:creditCardSearchText|orderBy: \'Name\''] img");
  await page.click(".ui-dialog-buttonset > :nth-child(1)");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

