/*
 * Test Name: 40136 [Merge] Corp admin - Corporate user can't delete role and an error message is displayed and can edit Per Diem
 * Description: 
 * Status: Active
 * Labels: Administration,merge,PerDiem,Role,Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-04-07T07:54:11Z
 * Updated: 2025-09-29T03:20:53Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@prof.com');
  await click_on_administration();
  await Adding_new_role_and_checking_that_it_is_not_possible_to_delete_it();
  await Editing_and_saving_per_diem();
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

async function click_on_administration() {
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
}

async function Adding_new_role_and_checking_that_it_is_not_possible_to_delete_it() {
  await page.click("[title='Roles']");
  await waitForText(page, ".datatable-header tr > :nth-child(1)", 'Role');
  await page.click("[data-ng-click='onAddNewRoleClicked()'] span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("[data-ng-model='role.Name']", randomValue);
  await page.click(".role-edit-container [ng-checked='model.selectAllUnSelected']");
  await page.click(".role-edit-container [data-ng-click='addItemToList(unselectedItems, selectedItems,true)']");
  await page.type("[is-edit-users='isEditUsers'] .ng-dirty", 'Hudgens vanessa');
  await page.click("[is-edit-users='isEditUsers'] [ng-checked='model.selectAllUnSelected']");
  await page.click("[is-edit-users='isEditUsers'] [data-ng-click='addItemToList(unselectedItems, selectedItems,true)']");
  await scrollToElement(page, "[data-ng-click='onSaveClicked()']");
  await page.click("[data-ng-click='onSaveClicked()']");
  await waitForText(page, ".toast-title", 'Save succeeded');
  await scrollToElement(page, ".admin-search-bar [data-ng-class='{searchClearIcon: searchText != \'\', searchBoxSearchIcon: searchText == \'\'}']");
  await page.type("[placeholder='Search role name or privileges']", randomValue);
  await waitForText(page, "[data-ng-repeat='role in roles | filter:roleSearchText'] > :nth-child(1) .ng-binding", randomValue);
  //TODO Please add an assertion here
await isVisible(page, ".button-secondary");
  await page.click(".button-secondary");
  await waitForText(page, "#ui-id-2", 'Delete Role');
  await page.click(".ui-dialog-buttonset > :nth-child(1)");
  await waitForText(page, ".toast-title", 'Save failed');
}

async function Editing_and_saving_per_diem() {
  await page.click("[title='Per Diem Settings']");
  await page.click("[title='testim - specific test - do not touch it']");
  await waitForText(page, ".selected-details-container > :nth-child(1) .admin-field-group-header", 'General information');
  await page.click("[ng-click='onNewDestinationClicked()'] a");
  await page.click("[id='s2id_autogen129'] b");
  await page.click("[class$='drop-active'], [class*='drop-active '] .select2-results > li:nth-of-type(1) .select2-result-label");
  await page.type("[data-ng-model='destination.DailySum']", '10');
  await page.click("[id='s2id_autogen131'] b");
  await page.click("[id='select2-drop'] .select2-results > li:nth-of-type(1) .select2-result-label");
  await page.click(".button-primary");
  await waitForText(page, ".toast-title", 'Save succeeded');
  await page.click("[ng-click='onRemoveDestenation($index)']");
  await page.click(".button-primary");
  await waitForText(page, ".toast-title", 'Save succeeded');
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

