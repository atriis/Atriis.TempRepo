/*
 * Test Name: 33166 PerDiem created from manual flight without checkout
 * Description: per diem should be created for flight round trip even without checkout
 * Status: Active
 * Labels: Regression,Manual Quote,PerDiem,Keeps failing,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-10-09T06:12:14Z
 * Updated: 2025-10-19T08:14:32Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('uri@pidi.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await add_manual_quote_flight_round_trip_LON_MAD();
  await On_Hold___Wait_for_element_text();
  await scrollTo(page, 0, 565);
  await waitForText(page, ".quote-info > :nth-child(1) .muliSemiBold", 'Per diem');
  await waitForText(page, ".center-title", 'Per-Diem for Madrid');
  await waitForText(page, ".per-diem-quote-card .has-text-weight-semibold", 'Per-Diem for Madrid');
  await waitForText(page, ".per-diem-quote-card [class^='ml'], [class*=' ml']", 'Confirmed');
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
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
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

async function add_manual_quote_flight_round_trip_LON_MAD() {
  await page.click(".is-capitalized");
  await waitForText(page, ".flight-number", 'Flight 1');
  await page.type("#el-id-1095-4118", 'lon');
  await page.click("[id='el-id-1095-3383-item-0'] .ellipsis");
  await page.click("#el-id-1095-4119");
  await page.click("[id='el-id-1095-3385'] [aria-label='Next Month'] svg");
  await page.click("[id='el-id-1095-3385'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-1095-3386");
  await page.click("[id='el-id-5201-2908'] [name='hours'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-5201-2915 > span");
  await page.click(".flight-number");
  if (false) {
    await page.click("[id='el-id-1095-3387'] .btn-apply");
  }
  await page.type("#el-id-1095-4123", 'mad');
  await page.click("[id='el-id-1095-3477-item-0'] .has-text-weight-bold");
  await page.click("#el-id-1095-3480");
  await page.click("[id='el-id-5201-3002'] [name='hours'] [fill='currentColor']");
  await page.click("#el-id-5201-3012 > span");
  await page.click(".flight-number");
  if (false) {
    await page.click("[id='el-id-1095-3481'] .btn-apply");
  }
  await page.type("#el-id-1095-4128", '123');
  await page.type("#el-id-1095-4132", 'rewq23');
  await page.type("#el-id-1095-4133", 'el al');
  await page.click("#el-id-1095-3779 > span");
  await page.click("#el-id-1095-3378");
  await page.type("#el-id-1095-3378", '1');
  await page.click(".icon-text");
  await waitForText(page, "[data-flight-index='1'] .flight-number", 'Flight 2');
  await page.click("#el-id-1779-4875");
  await page.click("[id='el-id-1779-4141'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-1779-4141'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-1779-4142");
  await page.click("[id='el-id-5201-3687'] [name='hours'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-5201-3692 > span");
  await page.click("[data-flight-index='1'] .flight-number");
  if (false) {
    await page.click("[id='el-id-1779-4143'] .btn-apply");
  }
  await page.click("#el-id-1779-4236");
  await page.click("[id='el-id-5201-3781'] [name='hours'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-5201-3790 > span");
  if (false) {
    await page.click("[id='el-id-1779-4237'] .btn-apply");
  }
  await page.type("#el-id-2300-4879", 'lon');
  await sendSpecialCharacter(page, "#el-id-2937-4446", 'Tab');
  await page.type("#el-id-1779-4884", '456');
  await page.type("#el-id-1779-4888", 'tgfre');
  await page.click("[data-flight-index='1'] [name='carrier'] .el-select__placeholder span");
  await page.type("#el-id-1779-4889", 'british');
  await page.click("#el-id-1779-4467 > span");
  await page.waitFor(2000);
  await page.click(".add-quote-btn");
}

async function On_Hold___Wait_for_element_text() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

