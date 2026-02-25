/*
 * Test Name: 37921 MERGED can see all dependencies when deactivating user with dependencies + can deactivate user with dependency
 * Description: 
 * Status: Active
 * Labels: Administration,Regression,Deactivate,Users,Daily Shell,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-04-08T09:51:02Z
 * Updated: 2025-09-05T01:34:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Avi@Avrahami.com');
  await click_on_administration();
  await page.click("[title='Users']");
  await waitForText(page, ".datatable-header tr > th:nth-of-type(2) span", 'First Name');
  await page.type("[ng-disabled='isDisabled']", 'Penni dep');
  await waitForText(page, "[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > td:nth-of-type(2) .ng-binding", 'penni');
  await page.click("[ng-model='user.IsChecked']");
  await page.click("[data-ng-click='openDeactivateUserPopup(selectedUsers)'] span");
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] td > :nth-child(1) > :nth-child(2)", 'The user \'penni dep\' is associated with the following dependencies:');
  await waitForText(page, "[ng-show='dep.DependencyName == \'User\'']", 'Daphna Depen - Approval Flow Approver');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] td > :nth-child(1) > :nth-child(4)", 'If you proceed with the deactivation process, he will no longer be part of these dependencies. Are you sure you would like to proceed?');
  await page.click("[ng-click='onSaveClicked()']");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click("[data-ng-model='showInactive']");
  await waitForText(page, ".user-scroll-corporate [ng-hide='user.DeletionDate && user.DeletionDate!=null']", 'Inactive');
  await page.click("[data-ng-class='{searchClearIcon: searchText != \'\', searchBoxSearchIcon: searchText == \'\'}']");
  await page.type("[ng-disabled='isDisabled']", 'Daphna');
  await waitForText(page, "[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > td:nth-of-type(2) .ng-binding", 'Daphna');
  await page.click("[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > td:nth-of-type(2) .ng-binding");
  await scrollToElement(page, "[on='settings.isDisplayCorporateApprovalFlowIdInherited'] .admin-field-group > :nth-child(1) label");
  await waitForText(page, "[class$='choices'], [class*='choices '] .ng-binding", 'penni dep (deactivatewith@dependency.com)');
  await scrollToElement(page, "[data-ng-class='{searchClearIcon: searchText != \'\', searchBoxSearchIcon: searchText == \'\'}']");
  await page.click("[data-ng-class='{searchClearIcon: searchText != \'\', searchBoxSearchIcon: searchText == \'\'}']");
  await page.type("[ng-disabled='isDisabled']", 'Nancy lotof');
  await waitForText(page, "[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > td:nth-of-type(2) .ng-binding", 'Nancy');
  await page.click("[ng-model='user.IsChecked']");
  await page.click("[data-ng-click='openDeactivateUserPopup(selectedUsers)'] span");
  await Validations_for_text();
  await Validate_link();
  await Validate_dependency();
  await page.click("#popUpCloseBtn > div");
  await Activate_first_user_from_the_test_to_the_next_run();
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

async function Validations_for_text() {
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] td > :nth-child(1) > :nth-child(2)", 'The user \'Nancy Lotof\' is associated with the following dependencies:');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(1) [target='_blank']", 'TESTIM mandatory field - Travel Manager');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(2) [ng-show='dep.DependencyName == \'User Group\'']", 'dependency - Approval For Changes Approver');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(3) [ng-show='dep.DependencyName == \'User Group\'']", 'amadeus - Booker, Approval Flow Approver');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(4) [ng-show='dep.DependencyName == \'User\'']", 'Mendy Tori - Backup Approver');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(5) [ng-show='dep.DependencyName == \'User\'']", 'Lior Yahalomi - Approval Flow Approver, Out of Office Replacement');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(6) [ng-show='dep.DependencyName == \'User\'']", 'Avi Avrahami - Approval Flow Approver, Approval For Changes Approver');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(7) [ng-show='dep.DependencyName == \'Approval Flow\'']", /specific approver1/);
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(7) [ng-show='dep.DependencyName == \'Approval Flow\'']", /specific approver2/);
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(8) [ng-show='dep.DependencyName == \'Financial Reference\'']", 'bz-w-kiev - Financial Reference Approver');
  await waitForText(page, "[ng-show='dependantUsers.length == 1'] td > :nth-child(1) > :nth-child(4)", 'If you proceed with the deactivation process, he will no longer be part of these dependencies. Are you sure you would like to proceed?');
}

async function Validate_link() {
  await page.click("[ng-show='dependantUsers.length == 1'] ul > li:nth-of-type(1) [target='_blank']");
}

async function Validate_dependency() {
  await waitForText(page, "[name='Name']", 'TESTIM mandatory field');
}

async function Activate_first_user_from_the_test_to_the_next_run() {
  await page.click("[data-ng-class='{searchClearIcon: searchText != \'\', searchBoxSearchIcon: searchText == \'\'}']");
  await page.click("[data-ng-class='{searchClearIcon: searchText != \'\', searchBoxSearchIcon: searchText == \'\'}']");
  await page.type("[ng-disabled='isDisabled']", 'Penni dep');
  await waitForText(page, "[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > td:nth-of-type(2) .ng-binding", 'penni');
  await waitForText(page, ".user-scroll-corporate [ng-hide='user.DeletionDate && user.DeletionDate!=null']", 'Inactive');
  await page.click("[ng-model='user.IsChecked']");
  await page.click("[data-ng-click='onActivateOrDeactivateClicked(true)'] span");
  await waitForText(page, ".user-scroll-corporate [ng-hide='user.DeletionDate && user.DeletionDate!=null']", 'Active');
}

