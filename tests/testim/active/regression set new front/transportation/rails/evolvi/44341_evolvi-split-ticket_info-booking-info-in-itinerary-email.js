/*
 * Test Name: 44341 - Evolvi Split Ticket - Info, booking, info in itinerary email
 * Description: 
 * Status: Active
 * Labels: Club,Email,Regression,Rail,Daily Transportation,Full Purchase,Evolvi,Transportation,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-06-02T09:24:29Z
 * Updated: 2026-01-30T02:27:46Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com/");
  await Login('corp@evolvi32.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_UK_Rail();
  await Split_Ticket_options_in_search_form();
  await Search();
  await Result_page__select_Split_Ticket();
  await Split_Ticket_info_in_cart__before_checkout();
  await Fill_mandatory_fields_in_cart();
  await Split_Ticket_info_in_cart__after_checkout_and_itinerary_email();
  await Info_in_itinerary_email_matches_info_in_trip();
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

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
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

async function Select_UK_Rail() {
  await page.click(".el-input");
  await page.click(".el-select-dropdown span");
  await waitForText(page, "[role='button']", 'Advanced search');
}

async function Split_Ticket_options_in_search_form() {
  //TODO Please add an assertion here
await isVisible(page, ".evolvi-splittix-icon");
  //TODO Please add an assertion here
await isElementChecked(page, "form > :nth-child(4) > :nth-child(3) .el-checkbox__input");
  await page.hover(".app-tooltip__content");
  await waitForText(page, ".app-tooltip__description", 'SplitTix, or split ticketing, is a practice that allows travellers to save money on UK rail fares by purchasing multiple tickets for a single journey instead of a single, through ticket.');
  await page.click("[role='button']");
  await waitForText(page, "[aria-multiselectable='true'] [role='radiogroup'] > :nth-child(1) .el-radio__label", 'Split at board / alight stations');
  await waitForText(page, "[aria-multiselectable='true'] [aria-checked='true'] .el-radio__label", 'Split at calling stations');
  await page.click("[aria-multiselectable='true'] [role='radiogroup'] > :nth-child(1) .el-radio__inner");
  await page.click("[aria-multiselectable='true'] [role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.hover(".radio-info");
  await waitForText(page, "[id='el-tooltip-3463'] > :nth-child(1) > :nth-child(4)", 'where the traveler may change ticket at a station when train stops, yet they will remain on the train and possibly be required to change seat.');
  await waitForText(page, "#el-tooltip-3463 > div:nth-child(1) > div.fs12.mb-2", 'where the traveler will only change ticket when getting on or off a train.');
}

async function Search() {
  await page.click(".radio-btns > :nth-child(2) .el-radio__label");
  await page.click("#el-id-439-183");
  await page.type("#el-id-439-183", 'SOU');
  await page.click("[id='el-id-439-151-item-0'] p");
  await page.click("#el-id-439-184");
  await page.type("#el-id-439-184", 'OXF');
  await page.click("[id='el-id-439-154-item-0'] p");
  await page.click("#el-id-439-185");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(3) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".btn--primary");
  await waitForText(page, ".results-header > :nth-child(2) .trains-info-container > :nth-child(2) > :nth-child(1)", 'Departs');
}

async function Expand_when_additional_options_availalbe() {
  if (!(await isVisible(page, ".results > :nth-child(5) .chavron"))) {
    return;
  }
  await page.click(".results > :nth-child(5) .chavron");
  //TODO Please add an assertion here
await isVisible(page, ".open > :nth-child(2)");
  await page.click(".results > :nth-child(5) .title-cell");
}

async function Split_Ticket_info() {
  await waitForText(page, ".results > :nth-child(3) .links-container > :nth-child(1)", 'SplitTix Available infoStandard');
  await page.click(".results > :nth-child(3) .material-symbols-outlined");
  await waitForText(page, "body > :nth-child(20) .el-dialog__header span", 'Save with SplitTix');
  await waitForText(page, ".el-dialog__body", /SplitTix, or split ticketing, is a practice that allows travellers to save money on UK rail fares by purchasing multiple tickets for a single journey instead of a single, through ticket./);
  await page.click("body > :nth-child(20) .el-dialog__close");
  //TODO Please add an assertion here
await isVisible(page, ".open > :nth-child(1) > div:nth-of-type(4)");
  await page.hover(".results > :nth-child(2) .price-row-container > :nth-child(1) > div:nth-of-type(4) .amount");
  await waitForText(page, "[aria-hidden='false'] .info-container p > :nth-child(1)", 'SplitTix fare selected - you are purchasing multiple tickets to cover the cost of your journey');
  await waitForText(page, ".info-container .sub-title", /^Saving of £/);
  await page.click("[class^='p'], [class*=' p']");
}

async function Add_Split_Ticket_fare_to_cart() {
  if (await getText(page, ".results > :nth-child(3) .links-container > :nth-child(1)") !== "/SplitTix Available/") {
    return;
  }
  await page.click(".results > :nth-child(2) .price-row-container > :nth-child(1) > div:nth-of-type(4) .amount");
  await page.click(".uk-rail-results .btn");
  await page.waitForSelector(".ticket-top-section", {state: "visible"});
  await waitForText(page, ".add-form-payment", 'Add payment method');
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Pending booking');
}

async function Result_page__select_Split_Ticket() {
  await scrollTo(page, 0, 415);
  await Expand_when_additional_options_availalbe();
  await Split_Ticket_info();
  await Add_Split_Ticket_fare_to_cart();
}

async function Split_Ticket_info_in_cart__before_checkout() {
  //TODO Please add an assertion here
await isVisible(page, ".evolvi-splittix-icon");
  await waitForText(page, ".ticket-layout-container .text--bold", /^SplitTix/);
  await page.click("[class^='pl'], [class*=' pl'] > :nth-child(1)");
  //TODO Please add an assertion here
await isVisible(page, ".el-drawer__open [draggable='true']");
  await waitForText(page, ".el-drawer__open .text--bold", /^SplitTix/);
  //TODO Please add an assertion here
await getText(page, "[class^='ml'], [class*=' ml'] span");
  await page.click("[aria-label='More details'] [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await scrollTo(page, 0, 402);
}

async function Delivery_method() {
  await page.click(".uk-rail-delivery-method .is-clickable");
  await waitForText(page, "[id='el-collapse-content-4489'] [tabindex='0'] .delivery-option > :nth-child(2)", '(Default)');
  await page.click("[role='radiogroup'] > :nth-child(3) .el-radio__inner");
  await page.click(".tabs-container .no-border");
  await page.waitForSelector(".uk-rail-delivery-method .material-symbols-outlined", {state: "visible"});
}

async function Seating() {
  await page.click(".uk-rail-seats .is-clickable");
  await waitForText(page, ".selection-container .muliBold", /^Leg 1/);
  await scrollToElement(page, ".tabs-container .no-border");
  await page.click(".tabs-container .no-border");
  await page.waitForSelector(".uk-rail-seats .material-symbols-outlined", {state: "visible"});
}

async function Reason_for_non_lowest() {
  if (await getText(page, ".uk-rail-non-lowest-reason .card-title") !== "'* Reason for Non Lowest'") {
    return;
  }
  await page.click(".uk-rail-non-lowest-reason .is-clickable");
  await waitForText(page, ".uk-rail-non-lowest-reason span", 'Select');
  await page.click("[id='el-collapse-content-289'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-3821-2444 > span");
  await page.click(".el-tabs .btn--primary");
  await page.waitForSelector(".uk-rail-non-lowest-reason .material-symbols-outlined", {state: "visible"});
}

async function Client_reference() {
  await page.click(".uk-rail-client-reference .is-clickable");
  await scrollToElement(page, ".page-layout-main .el-card__body > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) [type='text']");
  await page.click(".page-layout-main .el-card__body > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) [type='text']");
  await page.type(".page-layout-main .el-card__body > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) [type='text']", '1111');
  await page.click(".page-layout-main .el-card__body > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(2) [type='text']");
  await page.type(".page-layout-main .el-card__body > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(2) [type='text']", 'Test');
  await page.click("[id='pane-1659528'] > :nth-child(1) [type='text']");
  await page.type("[id='pane-1659528'] > :nth-child(1) [type='text']", '001');
  await page.click("[id='pane-1659528'] > :nth-child(2) [type='text']");
  await page.type("[id='pane-1659528'] > :nth-child(2) [type='text']", 'YES');
  await page.click("#el-id-1913-2464");
  await page.type("#el-id-1913-2464", 'testim');
  await page.click("#el-id-5149-2576");
  await page.type("#el-id-5149-2576", '453');
  await page.click(".tabs-container .no-border");
  await page.waitForSelector(".uk-rail-client-reference .material-symbols-outlined", {state: "visible"});
}

async function Reference_fields_for_checkout() {
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'General Reference Questions');
  await page.click(".general-questions > :nth-child(1) [type='text']");
  await page.type(".general-questions > :nth-child(1) [type='text']", '1111');
  await page.click(".general-questions > :nth-child(2) [type='text']");
  await page.type(".general-questions > :nth-child(2) [type='text']", '2222');
  await page.click(".general-questions > :nth-child(3) [type='text']");
  await page.type(".general-questions > :nth-child(3) [type='text']", '3333');
}

async function Fill_mandatory_fields_in_cart() {
  await Delivery_method();
  await Seating();
  await Reason_for_non_lowest();
  await Client_reference();
  await page.click(".el-checkbox__inner");
  await page.waitFor(1000);
  await page.click(".btn-container span");
  await Reference_fields_for_checkout();
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__description", 'Your order has been processed successfully');
}

async function Split_Ticket_info_in_cart__after_checkout_and_itinerary_email() {
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Ticketing Complete');
  await page.waitForSelector(".evolvi-splittix-icon", {state: "visible"});
  await waitForText(page, ".ticket-layout-container .text--bold", /^SplitTix/);
  await page.click("[class^='pl'], [class*=' pl'] > :nth-child(1)");
  await waitForText(page, ".segments > :nth-child(2) h6", 'Price summary');
  await page.click("[aria-label='More details'] [fill='currentColor']");
  await page.waitForSelector(".evolvi-splittix-icon", {state: "visible"});
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click(".share-icon");
  await page.waitFor(500);
  await page.click("#el-id-8502-2652 > li:nth-child(2)");
  await waitForText(page, "body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody > tr:nth-child(4) > td", 'UK Rail');
  await scrollTo(page, 0, 400);
  //TODO Please add an assertion here
await isVisible(page, "[width='16']");
  await waitForText(page, "[width='49%'] [align='center'] > :nth-child(1) > :nth-child(2) .em_grey_txt > :nth-child(9) > :nth-child(1) span", 'SplitTix Ticket');
  await waitForText(page, "[width='49%'] [align='center'] > :nth-child(1) > :nth-child(2) .em_grey_txt > :nth-child(9) > div:nth-of-type(3) > span:nth-of-type(1) span", splitInfo);
}

async function Info_in_itinerary_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function Apple_passkey_link_in_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function Google_wallet_link_in_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function Info_in_itinerary_email_matches_info_in_trip() {
  //TODO Please add an assertion here
await getText(page, "[width='49%'] [align='center'] > :nth-child(1) > :nth-child(2) .em_grey_txt > :nth-child(9) > :nth-child(3)");
  //TODO Please add an assertion here
await getText(page, "[width='49%'] [align='center'] > :nth-child(1) > tr:nth-of-type(5) a");
  //TODO Please add an assertion here
await getText(page, "[width='49%'] [align='center'] > :nth-child(1) > tr:nth-of-type(7) a");
  // Converting a 'email-generator' step has to be done manually at this time
  await page.click("[valuekey='value']");
  await page.type("[valuekey='value']", itineraryEmail);
  await page.click("[role='region'] h2");
  await page.waitForSelector(".recipients-list > :nth-child(2) .is-clickable", {state: "visible"});
  await page.click("body > :nth-child(13) .btn--primary");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.waitFor(2000);
  await Info_in_itinerary_email();
  await Apple_passkey_link_in_email();
  await Google_wallet_link_in_email();
}

