/*
 * Test Name: 64372 - Save correct FQTV from traveler profile when single quote with separate tickets/multiple carriers
 * Description: 
 * Status: Active
 * Labels: FQTV,Club,separate tickets,Flights,Regression,Sabre,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-07-13T11:45:42Z
 * Updated: 2025-09-14T12:52:45Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('multifqtv@corp.club');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip_by_schedule('IAH', 'ATL');
  await Copy_of_Select_flights_from_results__by_schedule_search_();
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Validate_save_FQTV();
  await Trip_Cancelation();
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

async function Search_flights_round_trip_by_schedule(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id*='id'] .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click(".search-btn");
}

async function Copy_of_Select_flights_from_results__by_schedule_search_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click("#el-id-2736-1357");
  await page.type("#el-id-2736-1357", 'DL');
  await page.click("[id='el-id-7697-811'] > :nth-child(1) .el-checkbox__inner");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click("#el-id-2736-1357");
  await page.type("#el-id-2736-1357", 'UA');
  await page.click("[id='el-id-7697-811'] > :nth-child(1) .el-checkbox__inner");
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
  await waitForText(page, ".pricing-options-container > :nth-child(1) .more-info div > :nth-child(1) > :nth-child(2)", 'Separated Tickets');
  await page.click(".pricing-options-container > :nth-child(1) .btn--primary");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Validate_save_FQTV() {
  await scrollToElement(page, ".flight-frequent-flyer .is-clickable");
  await page.click(".flight-frequent-flyer .is-clickable");
  await waitForText(page, "[id='el-id-7016-2731'] > :nth-child(2) .el-radio__label", 'New');
  await waitForText(page, ".padding section > :nth-child(1) .el-select__placeholder span", 'DL - 1741551211');
  await waitForText(page, ".padding section > :nth-child(2) .el-select__placeholder span", 'UA - N7J91W1');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

