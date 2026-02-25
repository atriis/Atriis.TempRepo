/*
 * Test Name: 18418 we should be able to remove per diem settings from user profile
 * Description: 
 * Status: Active
 * Labels: Regression,PerDiem,Administration,Daily Shell,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-03-13T07:53:36Z
 * Updated: 2026-01-01T06:43:02Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('testim@add.com');
  await click_on_administration();
  await page.click("[title='Users']");
  await waitForText(page, "[data-ng-click='onAddNewUserClicked()'] span", 'Add New User');
  await page.click(".body-container tbody > :nth-child(1) > :nth-child(2)");
  await waitForText(page, "[user='selectedUser'] > :nth-child(1) > :nth-child(1) label", 'First Name:');
  await scrollToElement(page, "");
  await waitForText(page, "[on='settings.isDisplayCorporatePerdiemIdInherited'] label", 'Per Diem');
  await k();
  await waitForText(page, "#s2id_autogen91 > a > span.select2-chosen", 'per diem for user');
  await page.click("[data-ng-show='!settings.isDisplayCorporatePerdiemIdInherited']");
  await page.click("[data-ng-click='onSaveClicked()']");
  await waitForText(page, ".toast-title", 'Save succeeded');
  await scrollTo(page, 0, 0);
  await waitForText(page, ".body-container tbody > :nth-child(2) > :nth-child(5)", 'TESTIM');
  await page.click(".body-container tbody > :nth-child(2) > :nth-child(5)");
  await waitForText(page, "[user='selectedUser'] > :nth-child(1) > :nth-child(1) label", 'First Name:');
  await page.click(".body-container tbody > :nth-child(1) > td:nth-of-type(2) .ng-binding");
  await waitForText(page, "[user='selectedUser'] > :nth-child(1) > :nth-child(1) label", 'First Name:');
  await waitForText(page, "[on='settings.isDisplayCorporatePerdiemIdInherited'] label", 'Per Diem');
  await waitForText(page, "[data-ng-hide='!settings.isDisplayCorporatePerdiemIdInherited']", 'per diem for user group');
  await page.click("[on='settings.isDisplayCorporatePerdiemIdInherited'] img");
  await page.click("#s2id_autogen219 > a > span.select2-arrow > b");
  await page.click("[id='select2-drop'] [class$='results'], [class*='results '] > li:nth-of-type(2) [class$='result-label'], [class*='result-label ']");
  await page.click("[data-ng-click='onSaveClicked()']");
  await waitForText(page, ".toast-title", 'Save succeeded');
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function k() {
  if (!(await isVisible(page, "[data-ng-click='settings.isDisplayCorporatePerdiemIdInherited=false']"))) {
    return;
  }
  await page.click("[data-ng-click='settings.isDisplayCorporatePerdiemIdInherited=false']");
  await page.click("#s2id_autogen91 > a > span.select2-arrow > b");
  await page.click("[id='select2-drop'] [class$='results'], [class*='results '] > li:nth-of-type(2) [class$='result-label'], [class*='result-label ']");
  await waitForText(page, "#s2id_autogen91 > a > span.select2-chosen", 'per diem for user');
}

