/*
 * Test Name: 64936 Evolvi > e-ticket link exist on share itinerary
 * Description: e-ticket link exist confirmation. NOTE: Can only be run on grid!
 * Status: Active
 * Labels: Regression,Rail,Evolvi,Full Purchase,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-07-29T10:23:17Z
 * Updated: 2025-09-14T12:56:04Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('corp@evolvi32.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_UK_Rail();
  await Search_Evolvi_one_way();
  await Select_lowest_fare();
  await UK_Rail__Evolvi__add_to_cart();
  await Pending_booking___wait_for_element_text();
  await select_eTicket();
  await Seating_Confirm();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await General_Preference_Question();
  await Book_and_finalize();
  //TODO Please add an assertion here
await getText(page, "[class^='ml'], [class*=' ml'] .confirmation-number--value");
  await Click_on_share_itinerary_from_cart();
  //TODO Please add an assertion here
await getText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(1) tr > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(3)");
  await scrollTo(page, 0, 600);
  await page.click("[width='49%'] [align='center'] > :nth-child(1) > :nth-child(2) .em_grey_txt > :nth-child(18) > span:nth-of-type(1) a");
  await untitled_download_validation();
  await compare_eticket();
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

async function Select_UK_Rail() {
  await page.click(".el-input");
  await page.click(".el-select-dropdown span");
  await waitForText(page, "[role='button']", 'Advanced search');
}

async function Search_Evolvi_one_way() {
  await page.click(".radio-btns > :nth-child(2) .el-radio__label");
  await page.click("#el-id-439-183");
  await page.type("#el-id-439-183", '182');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-439-184");
  await page.type("#el-id-439-184", '115');
  await page.click("[id='el-id-2651-172'] p");
  await page.click("#el-id-439-185");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(3) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".btn--primary");
  await waitForText(page, ".results-header > :nth-child(2) .trains-info-container > :nth-child(2) > :nth-child(1)", 'Departs');
}

async function Select_lowest_fare() {
  await page.click("[aria-describedby='el-id-7130-221'] .amount");
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function UK_Rail__Evolvi__add_to_cart() {
  await waitForText(page, ".selected-prices-container .btn", 'Add to trip');
  await page.click(".uk-rail-results .btn");
  await Pending_booking___wait_for_element_text();
}

async function select_eTicket() {
  await page.click(".uk-rail-delivery-method .is-clickable");
  await page.click(".el-radio-group > :nth-child(3) .el-radio__inner");
  await page.click("[id='pane-overview'] .btn--primary");
}

async function Seating_Confirm() {
  await page.click(".uk-rail-seats .is-clickable");
  await page.click("[id='pane-overview'] .btn--primary");
  await page.waitForSelector(".uk-rail-seats .material-symbols-outlined", {state: "visible"});
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function General_Preference_Question() {
  await page.click("#el-id-6407-6741");
  await page.type("#el-id-6407-6741", '1234');
  await page.click("#el-id-6407-6742");
  await page.type("#el-id-6407-6742", '2352');
  await page.click("#el-id-6407-6743");
  await page.type("#el-id-6407-6743", '1234');
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Click_on_share_itinerary_from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-3021-171 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function untitled_download_validation() {
  // Converting a 'cli-validation-download-file' step has to be done manually at this time
}

async function compare_eticket() {
  await page.evaluate(() => {
    if (eticketTripOverview !== eticketShareItinerary) {
        throw new Error(`❌ eTickets does not match!`)
    }
  });
}

