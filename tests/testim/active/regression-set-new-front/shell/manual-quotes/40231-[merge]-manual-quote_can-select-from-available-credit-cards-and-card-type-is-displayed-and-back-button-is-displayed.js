/*
 * Test Name: 40231 [Merge] Manual Quote - Can select from available credit cards and card type is displayed and "Back" button is displayed
 * Description: 
 * Status: Active
 * Labels: Regression,Manual Quote,Cars,FOP,No Amadeus Hotel Book,merge,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-12-19T04:15:06Z
 * Updated: 2026-02-17T08:58:29Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunasantos@manualquote.com');
  await book_a_new_trip();
  await page.click(".is-capitalized");
  await waitForText(page, "#pane-flight > div", 'Please add traveler for this trip.');
  await Add_traveler___I_am_the_traveler();
  await waitForText(page, "[id='pane-flight'] h4", /quote/);
  await waitForText(page, ".title-container p", 'Back');
  await page.click("[id='tab-car'] p");
  await scrollToElement(page, "[id='pane-car'] [class^='my'], [class*=' my']");
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, "#el-id-3171-581 > span", 'testim one');
  await page.click("#el-id-9265-586 > span");
  await waitForText(page, "[id='pane-car'] .credit-type-select .el-select__placeholder span", 'Visa Credit');
  await page.click("[id='pane-car'] .credit-type-select svg");
  await waitForText(page, "#el-id-9265-589 > div > div > span", 'MasterCard');
  await waitForText(page, "#el-id-9265-590 > div > div > span", 'American Express');
  await waitForText(page, "#el-id-9265-591 > div > div > span", 'Diners Club');
  await waitForText(page, "#el-id-9265-593 > div > div > span", 'Discover');
  await waitForText(page, "#el-id-9265-592 > div > div > span", 'Visa Credit');
  await waitForText(page, "#el-id-9265-594 > div > div > span", 'Air Plus');
  await waitForText(page, "#el-id-9265-595 > div > div > span", 'EHotel');
  await page.click(".title-container p");
  await waitForText(page, "h1", /Welcome/);
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

