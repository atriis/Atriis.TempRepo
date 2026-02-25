/*
 * Test Name: Refundable Hotels
 * Description: a non refundable script.
Not necessarily should be used, because after choosing a room, it can be filtered to refundable. 
 * Status: Active
 * Labels: Helper
 * Owner: Unassigned
 * Created: 2022-12-18T02:04:48Z
 * Updated: 2022-12-18T02:52:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await LOG_IN('test@io.com');
  await page.click("[title='Book a New Trip'] .material-symbols-outlined");
  await page.click("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", 'lon');
  await page.click("[id='el-autocomplete-8189-item-0'] .has-text-weight-bold");
  await page.click(".el-range-editor");
  await page.dblclick(".el-icon-arrow-right");
  await page.dblclick(".el-icon-arrow-right");
  await page.dblclick(".el-icon-arrow-right");
  await page.click(".el-icon-arrow-right");
  await page.click(".el-icon-arrow-right");
  await page.click(".el-icon-arrow-right");
  await page.click(".is-right tbody > :nth-child(5) > td:nth-of-type(4) span");
  await page.click(".end-date span");
  await page.click(".btn");
  await page.click(".hotel-list > :nth-child(1) .see-availability-btn");
  await refundable_hotel();
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

function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}


// shared steps \\
async function LOG_IN(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function Click_Refundable() {
  await page.evaluate(() => {
    let RefElem=document.querySelector(`div.refundable`);
    let upDiv=RefElem.parentElement.parentElement.parentElement.parentElement;
    let addToTrip=upDiv.children[1].children[0].children[0].children[0].children[3]
    addToTrip.click();
  });
}

async function refundable_hotel() {
  await scrollTo(page, 0, 4000);
  if (false) {
    await page.hover("[aria-describedby='el-tooltip-3707']");
  }
  if (false) {
    //TODO Please add an assertion here
await getText(page, "#el-tooltip-3707");
  }
  await Click_Refundable();
}

