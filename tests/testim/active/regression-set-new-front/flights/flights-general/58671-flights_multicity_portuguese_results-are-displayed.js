/*
 * Test Name: 58671 Flights - Multicity - Portuguese - Results are displayed
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,multicity,portuguese,results,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-02-26T09:58:26Z
 * Updated: 2025-09-14T10:36:01Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('aiva@amadeusportuguese.com');
  await waitForText(page, "h1", /Bem-vindo/);
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_multicity_flights();
  await Results_are_displayed();
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

async function Book_a_new_trip() {
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

async function Search_multicity_flights() {
  await page.click("[id='el-id-2911-77'] > :nth-child(3) .el-radio__label");
  await page.click(".add-flight-btn");
  await page.click(".add-flight-btn");
  await page.type("#el-id-2911-1530", 'lon');
  await page.click("[id='el-id-2911-1518-item-0'] .ellipsis");
  await page.type("#el-id-2911-1531", 'mad');
  await page.click("[id='el-id-2911-1521-item-0'] .ellipsis");
  await page.click("#el-id-2911-1532");
  await page.click("[id='el-id-2911-1523'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-2911-1523'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-2911-1523'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-2911-1547", 'mad');
  await page.click("[id='el-id-2911-1535-item-0'] .has-text-weight-bold");
  await page.type("#el-id-2911-1548", 'rom');
  await page.click("[id='el-id-2911-1538-item-0'] .has-text-weight-bold");
  await page.click("#el-id-2911-1549");
  await page.click("[id='el-id-2911-1540'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-5000-330");
  await page.type("#el-id-5000-330", 'rom');
  await page.click("#el-id-5000-318-item-0 > div");
  await page.type("#el-id-5000-331", 'lon');
  await page.click("#el-id-5000-321-item-0 > div");
  await page.click("#el-id-5000-332");
  await page.click("[id='el-id-5000-323'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-5000-323'] tbody > :nth-child(5) > td:nth-of-type(7) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Results_are_displayed() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Adicionar à viagem');
}

