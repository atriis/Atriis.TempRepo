/*
 * Test Name: 67510 BenerailMoove - Improvement for Journey Summary (Direct/Changes)
 * Description: 
 * Status: Active
 * Labels: Benerail Moove Regression,Rail,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-09-24T02:08:53Z
 * Updated: 2025-09-26T03:48:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("ui-dev.gtp-staging.com/signin");
  await Login('Testim@benemoove.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Benerail_one_way('BEBMI', 'amsterdam ce');
  await Benerail___Results___Wait_for__Select__text();
  await Not_direct_Journey();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
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

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
}

async function Search_Benerail_one_way(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click(".from-row [placeholder='Date']");
  await page.click("#el-id-3123-140");
  await page.click("[aria-label='Next Month']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await old2();
  await page.click(".search-btn");
}

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

async function Journey_Changes_count(getElement) {
  await page.evaluate((getElement) => {
    
      let changes;
      const html = getElement.outerHTML; // convert element to string
    
      // Case: multiple changes
      if (html.includes("has-multiple-changes")) {
        changes = (html.match(/class="journey-change-dot/g) || []).length;
      } 
      // Case: one change
      else if (html.includes("journey-timeline")) {
        changes = 1
      } 
    
      // Case: no changes and must show "Direct"
      if (
        html.includes("journey-timeline no-changes") &&
        html.includes('class="change-text green muliSemiBold"') &&
        html.includes(">Direct<")
      ) {
        console.log("Direct text exists (no changes).");
        changes = 0; // no changes
      }
    
        // Assertion
      if (Number(value) !== null && changes !== Number(value)) {
        throw new Error(`Assertion failed: expected ${value}, got ${changes} dots`);
      }
    
      // Find the <span> inside the provided element
      const span = getElement.querySelector(".change-text");
    
      if (!span) {
        throw new Error("No element with class 'change-text' found");
      }
    
      // Get computed CSS color
      const color = window.getComputedStyle(span).color;
    
      // Normalize expected colors (browser gives rgb instead of hex)
      const rgbToHex = (rgb) => {
        const parts = rgb.match(/\d+/g).map(Number);
        return (
          "#" +
          parts
            .slice(0, 3)
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("")
        );
      };
    
      const hexColor = rgbToHex(color);
    
      // Logic: red (#ef4438) if changes > 0, green (#4caf4e) if Direct
      if (span.textContent.includes("change")) {
        if (hexColor !== "#ef4438") {
          throw new Error(
            `Expected red (#ef4438) for changes, got ${hexColor}`
          );
        }
        console.log(`${value} change > color red`);
      } else if (span.textContent.includes("Direct")) {
        if (hexColor !== "#4caf4e") {
          throw new Error(
            `Expected green (#4caf4e) for Direct, got ${hexColor}`
          );
        }
        console.log(`Direct > color green`);
      }
      console.log(`Changes ${value} - Dots on journey summary ${changes}`);
    
  }, getElement);
}

async function Not_direct_Journey() {
  //TODO Please add an assertion here
await getText(page, ".rail-list > :nth-child(1) .change-text");
  await Journey_Changes_count(".rail-list > :nth-child(1) .journey-details");
}

