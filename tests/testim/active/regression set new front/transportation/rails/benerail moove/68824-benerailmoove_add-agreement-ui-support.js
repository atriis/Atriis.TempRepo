/*
 * Test Name: 68824 BenerailMoove - Add Agreement UI Support
 * Description: 
 * Status: Active
 * Labels: Rail,Transportation
 * Owner: Pedro Carneiro
 * Created: 2025-10-10T03:51:37Z
 * Updated: 2025-10-22T06:36:23Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://localhost:44324/");
  await Login('pmac@sncb.ral');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Benerail_one_way('BEBMI', 'GBSPX');
  await Benerail___Results___Wait_for__Select__text();
  await test();
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

async function Click_on__More_Options_(moreOptionsIndex) {
  await page.evaluate((moreOptionsIndex) => {
      console.log("Opening 'More Options'...");
    
      const options = Array.from(
        document.querySelectorAll('button.pricing-options-btn')
      );
    
      if (!options.length) {
        throw new Error("No 'More Options' elements found.");
      }
    
      if (moreOptionsIndex !== null && moreOptionsIndex >= 0 && moreOptionsIndex < options.length) {
        const opt = options[moreOptionsIndex];
        opt.scrollIntoView({ block: "center" });
        opt.click();
        console.log(`Clicked option index ${moreOptionsIndex}`);
      } else {
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          opt.scrollIntoView({ block: "center" });
          opt.click();
          console.log(`Clicked option index ${i}`);
        }
        console.log("All 'More Options' clicked.");
      }
    
    
  }, moreOptionsIndex);
}

async function Agreement_Visible() {
  await page.evaluate(() => {
    // Select all fare blocks with exact class
    const fares = document.querySelectorAll(
      '[class="ticket-layout is-flex is-flex-direction-column elevation-1"]'
    );
    
    console.log("Fare blocks found:", fares.length);
    
    // Select agreement indicators
    const agreements = document.querySelectorAll(
      'div[class="agreements-in-additional-indication is-flex p-2 mt-4 is-align-items-center"]'
    );
    console.log("Agreement indicators found:", agreements.length);
    
    // Count how many fares contain the "Contract fares available in options" text
    let contractCount = 0;
    
    fares.forEach(fare => {
      const el = fare.querySelector('span.agreement-img');
      if (el && el.offsetParent !== null) {
        const text = el.parentElement.innerText || "";
        if (text.includes("Contract fares available in options")) {
          contractCount++;
          console.log("Contract fare text found in:", fare);
        }
      }
    });
    
    console.log("Fares with contract text found:", contractCount);
    
    // Validation rules
    if (agreements.length > contractCount) {
      throw new Error(
        `Mismatch: ${agreements.length} agreement indicators found but ${contractCount} fares contain "Contract fares available in options"`
      );
    }
    
    if (agreements.length > fares.length) {
      throw new Error(
        `Too many agreement indicators (${agreements.length}) for only ${fares.length} fare blocks`
      );
    }
    
    if (agreements.length === 0) {
      throw new Error("No agreement indicators found.");
    }
    
    console.log("Validation passed: Agreement indicators match contract fares exactly.");
    
  });
}

async function test() {
  await Click_on__More_Options_();
  await Agreement_Visible();
}

