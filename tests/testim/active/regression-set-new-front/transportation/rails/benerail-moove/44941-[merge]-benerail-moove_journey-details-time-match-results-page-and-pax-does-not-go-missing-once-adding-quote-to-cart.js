/*
 * Test Name: 44941 [Merge] Benerail Moove - Journey details time match results page and pax does not go missing once adding quote to cart
 * Description: 
 * Status: Active
 * Labels: Rail,Keeps failing,Benerail Moove Regression,Bene seats,merge,results,Cart,Adding Passengers,Transportation,2026 plan 1,02
 * Owner: Bruna Santos
 * Created: 2024-04-18T09:24:08Z
 * Updated: 2025-11-06T02:29:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com/");
  await Login('beny@moove.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_benerail_by_place_one_way__direct_only_('bebmi', 'schiphol airport (nl)');
  await click_on_proceed_after_search();
  await Extract_times();
  await Click_JOURNEY_DETAILS();
  await Extract_times_journey_details_in_results_page();
  await Comparing_if_times_matches_in_results_page_and_journal_details(resultsPageLeavingTime, resultsPageArrivingTime, journeyDetailsLeavingTime, journeyDetailsArrivingTime);
  await Close_journey_details();
  await add_benerail_one_way_from_search_results_to_cart();
  await Pending_booking___wait_for_element_text();
  await Verifying_that_passenger_is_displayed_in_cart();
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

async function Search_benerail_by_place_one_way__direct_only_(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-5168-142");
  await page.click("#el-id-5168-35 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("#el-id-5168-35 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".rail-info-column > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6089-81");
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Extract_times() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await scrollToElement(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']");
  //TODO Please add an assertion here
await getText(page, ".journey-details > section:nth-of-type(1) .has-text-weight-bold");
  //TODO Please add an assertion here
await getText(page, ".journey-details > section:nth-of-type(2) .has-text-weight-bold");
}

async function Click_JOURNEY_DETAILS() {
  await page.click(".rail-list > section:nth-of-type(1) .ticket-bottom .is-flex > button:nth-of-type(2) .has-text-weight-bold");
  await waitForText(page, ".el-timeline > :nth-child(1) > :nth-child(1) .is-capitalized", 'bruxelles-midi (be)');
}

async function Extract_times_journey_details_in_results_page() {
  //TODO Please add an assertion here
await getText(page, ".departure .railSegment-hour-container");
  //TODO Please add an assertion here
await getText(page, ".arrival .railSegment-hour-container");
}

async function Comparing_if_times_matches_in_results_page_and_journal_details(firstValue, secondValue, thirdValue, fourthValue) {
  await page.evaluate((firstValue, secondValue, thirdValue, fourthValue) => {
    console.log(`firstValue: ${firstValue}`);
    console.log(`secondValue: ${secondValue}`);
    console.log(`thirdValue: ${thirdValue}`);
    console.log(`fourthValue: ${fourthValue}`);
    
    // Compare values and log accordingly
    if (firstValue === thirdValue && secondValue === fourthValue) {
        console.log('The first value is equal to the third value, and the second value is equal to the fourth value.');
    } else {
        throw new Error(`Error: firstValue (${firstValue}) does not equal thirdValue (${thirdValue}), or secondValue (${secondValue}) does not equal fourthValue (${fourthValue}).`); // Throw the error
    }
    
  }, firstValue, secondValue, thirdValue, fourthValue);
}

async function Close_journey_details() {
  await page.click("body > :nth-child(22) [xmlns='http://www.w3.org/2000/svg']");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_benerail_one_way_from_search_results_to_cart() {
  await page.waitForSelector(".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", {state: "visible"});
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Verifying_that_passenger_is_displayed_in_cart() {
  await waitForText(page, ".traveler-name", /Beny/);
}

