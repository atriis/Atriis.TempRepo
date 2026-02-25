/*
 * Test Name: 20044 travel policy - limitation with breakfast
 * Description: too flaky, hotels are always changing prices so this fails all the time. does not make sense to automate this flow.
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-08-25T10:42:31Z
 * Updated: 2024-09-11T12:17:07Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('brunasantosnl@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('London');
  await page.click("body > :nth-child(14) .btn--primary");
  await page.click("[placeholder='Search hotel']");
  await page.type("[placeholder='Search hotel']", 'ibis styles london heathrow');
  await Hotel___View_Rates();
  await scrollToElement(page, ".app-filter__content > :nth-child(4) h4");
  await filter_by_refundable_hotel_with_breakfast();
  // Converting a 'drag' step has to be done manually at this time
  await page.click(".price-range-min [type='text']");
  await page.waitFor(3000);
  await page.type(".price-range-min [type='text']", '0');
  await Ctrl_A();
  await page.click(".price-range-max [type='text']");
  await page.type(".price-range-max [type='text']", '111');
  await waitForText(page, ".room-list > :nth-child(2) .room-amenities-container span", /reakfast/);
  await page.hover(".info-icon");
  await waitForText(page, "#el-tooltip-3032 > ul > li", 'Limitation testim bruna - do not touch is violated 100 EUR in UNITED KINGDOM');
  await page.click(".page-view .router-link-active");
  await waitForText(page, ".hotel-list > :nth-child(1) .see-availability-btn", 'View rates');
  await page.type("[placeholder='Search hotel']", 'Renaissance London Heathrow Hotel');
  await Hotel___View_Rates();
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'drag' step has to be done manually at this time
  await page.type(".price-range-min [type='text']", '0');
  // Converting a 'drag' step has to be done manually at this time
  await page.type(".price-range-max [type='text']", '111');
  await page.hover(".info-icon");
  await waitForText(page, "#el-tooltip-3032 > ul > li", 'Limitation testim bruna - do not touch is violated 100 EUR in UNITED KINGDOM');
  await page.click(".page-view .router-link-active");
  await waitForText(page, ".hotel-list > :nth-child(1) .see-availability-btn", 'View rates');
  await page.click("[placeholder='Search hotel']");
  await page.type("[placeholder='Search hotel']", 'TRAVELODGE LONDON FELTHAM');
  await Hotel___View_Rates();
  await scrollToElement(page, ".price-range-min [type='text']");
  // Converting a 'drag' step has to be done manually at this time
  await page.type(".price-range-min [type='text']", '0');
  await page.click(".price-range-max [type='text']");
  await page.type(".price-range-max [type='text']", '99');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.hover(".info-icon");
  await waitForText(page, "#el-tooltip-3032 > ul > li", 'Limitation testim bruna - do not touch is violated 100 EUR in UNITED KINGDOM');
  await page.click(".main-layout ul > li:nth-of-type(1) a");
  await Search_hotel_1_night('Manchester,Manchester,UK,(MAN)');
  await page.click("body > :nth-child(14) .btn--primary");
  await page.click("[placeholder='Search hotel']");
  await page.type("[placeholder='Search hotel']", 'Travelodge Manchester Didsbury');
  await Hotel___View_Rates();
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

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function Hotel___Wait_for__View_rates__text_in_results_page() {
  await waitForText(page, ".hotel-list > :nth-child(1) .extra-info a", 'View rates');
}

async function Hotel___View_Rates() {
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .btn--primary", 'Add to trip');
}

async function filter_by_refundable_hotel_with_breakfast() {
  if (await getText(page, "[title='Breakfast']") !== "'            Breakfast          '") {
    return;
  }
  if (await getText(page, "[title='Breakfast']") === "/Breakfast/") {
    await page.click(".app-filter__content > :nth-child(3) .el-checkbox__inner");
  }
}

async function Ctrl_A() {
  await page.click(".price-range-min [type='text']");
  // Converting a 'keyboard-shortcut-step' step has to be done manually at this time
  // Converting a 'keyboard-shortcut-step' step has to be done manually at this time
  // Converting a 'keyboard-shortcut-step' step has to be done manually at this time
}

