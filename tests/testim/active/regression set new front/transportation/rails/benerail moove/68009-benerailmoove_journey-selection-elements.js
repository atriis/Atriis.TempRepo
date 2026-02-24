/*
 * Test Name: 68009 BenerailMoove - Journey selection elements
 * Description: 
 * Status: Active
 * Labels: Rail,Benerail Moove Regression,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-09-26T03:19:55Z
 * Updated: 2025-10-02T10:19:03Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('beny@moove.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Benerail_round_trip('DEDUI', 'NLASC');
  await click_on_proceed_after_search();
  await Benerail___Results___Wait_for__Select__text();
  await CSS_element_Validation(".eu-rail-stepper");
  await page.click(".rail-list > :nth-child(1) .btn--primary");
  await Benerail___Results___Wait_for__Select__text();
  await CSS_element_Validation_1(".eu-rail-stepper");
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
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
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

async function Click() {
  if (true) {
    return;
  }
  const boolean_31 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_31) {
    await page.click("[aria-label='Next Month']");
  }
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
  await sendSpecialCharacter(page, ".from-row [placeholder='Date']", 'Enter');
  await page.click(".to-row [placeholder='Date']");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".to-row [placeholder='Date']", returnDate);
  await sendSpecialCharacter(page, ".to-row [placeholder='Date']", 'Enter');
}

async function Search_Benerail_round_trip(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.type("[placeholder='From... Station or Location']", from);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.type("[placeholder='To... Station or Location']", to);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.click(".from-row [placeholder='Date']");
  await page.click("[id='el-id-7687-293'] [aria-label='Next Month']");
  await page.click("[id='el-id-7687-293'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-7687-405");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    await page.click(".from-row [placeholder='Date']");
  }
  if (false) {
    //TODO Please add an assertion here
await getText(page, "[x-placement='bottom-start'] .el-date-picker__header");
  }
  await Click();
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(4)");
  }
  if (false) {
    await page.click(".to-row [placeholder='Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(5)");
  }
  await page.click(".search-btn");
  await old2();
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

async function CSS_element_Validation(getElement) {
  await page.evaluate((getElement) => {
      // Select active and inactive page-number divs
      const spanActive = getElement.querySelector(".page-number.ml-2.isActive");
      if (!spanActive) {
        throw new Error("No element with class 'page-number ml-2 isActive' found");
      }
    
      const spanInactive = getElement.querySelector(".page-number.ml-2:not(.isActive)");
      if (!spanInactive) {
        throw new Error("No element with class 'page-number ml-2' (inactive) found");
      }
    
      // Get computed colors
      const colorActive = window.getComputedStyle(spanActive).backgroundColor;
      const colorInactive = window.getComputedStyle(spanInactive).backgroundColor;
    
      // Convert rgb → hex
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
    
      const hexColorActive = rgbToHex(colorActive);
      const hexColorInactive = rgbToHex(colorInactive);
    
      // Validate active = blue
      if (spanActive.textContent.trim() === "1") {
        if (hexColorActive !== "#1c73ff") {
          throw new Error(`Expected blue (#1c73ff), got ${hexColorActive}`);
        }
      }
    
      // Validate inactive = gray
      if (spanInactive.textContent.trim() === "2") {
        if (hexColorInactive !== "#7c7c7e") {
          throw new Error(`Expected gray (#7c7c7e), got ${hexColorInactive}`);
        }
      }
    
      console.log(
        `Active page: ${spanActive.textContent.trim()} color ${hexColorActive}, Inactive page: ${spanInactive.textContent.trim()} color ${hexColorInactive}`
      );
      exportsTest.activeColor = hexColorActive;
      exportsTest.inactiveColor = hexColorInactive;
    
  }, getElement);
}

async function CSS_element_Validation_1(getElement) {
  await page.evaluate((getElement) => {
    // find both active page-number elements inside the container
      const activeEls = getElement.querySelectorAll(".page-number.ml-2.isActive");
      if (activeEls.length < 2) {
        throw new Error(`Expected 2 active elements, found ${activeEls.length}`);
      }
    
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
    
      // --- first element: check mark ---
      const first = activeEls[0].querySelector("span");
      if (!first || !first.classList.contains("check-icon")) {
        throw new Error("First element does not contain check-icon span");
      }
      const firstBg = rgbToHex(window.getComputedStyle(activeEls[0]).backgroundColor);
      if (firstBg !== "#ffffff") {
        throw new Error(`First element expected white (#ffffff), got ${firstBg}`);
      }
    
      // --- second element: "2" ---
      const second = activeEls[1].querySelector("span");
      if (!second || second.textContent.trim() !== "2") {
        throw new Error(`Second element expected text "2", got "${second ? second.textContent.trim() : "none"}"`);
      }
      const secondBg = rgbToHex(window.getComputedStyle(activeEls[1]).backgroundColor);
      if (secondBg !== "#1c73ff") {
        throw new Error(`Second element expected blue (#1c73ff), got ${secondBg}`);
      }
    
      console.log(`Validation passed: check mark element bg: ${firstBg}, active element (2) bg: ${secondBg}`);
  }, getElement);
}

