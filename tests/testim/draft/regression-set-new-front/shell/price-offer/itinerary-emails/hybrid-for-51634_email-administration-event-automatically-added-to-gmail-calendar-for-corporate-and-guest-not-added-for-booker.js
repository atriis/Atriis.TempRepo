/*
 * Test Name: Hybrid for 51634 - Email administration, Event automatically added to Gmail calendar for corporate and guest, not added for booker
 * Description: 
 * Status: Draft
 * Labels: 
 * Owner: Noam Miller
 * Created: 2025-02-25T09:43:27Z
 * Updated: 2025-02-25T09:47:06Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('gmail@booker.com');
  await Start_a_New_Trip();
  await Navigate_to_settings();
  await Validate_email_administration();
  await Close_settings_tab();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi__rountrip_search('PAD', 'BTH');
  await Search_hotel_and_add_to_cart();
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

async function Start_a_New_Trip() {
  await book_a_new_trip();
  await waitForText(page, "#pane-flight > h4", 'Find flights for your trip');
}

async function Open_corporate_settings() {
  await page.evaluate(() => {
     window.open('https://2.gtp-staging.com/CorporateAdministration/276444#/Corporation/276444/Settings', '_blank', 'noopener,noreferrer');
  });
}

async function Navigate_to_settings() {
  await Open_corporate_settings();
  await waitForText(page, "#s2id_autogen25 > a > span.select2-chosen", 'GBP £');
}

async function Validate_email_provider_list() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Validate_email_administration() {
  //TODO Please add an assertion here
await isVisible(page, "#s2id_autogen15 > a > span.select2-chosen");
  await waitForText(page, "[data-ng-show='settingsViewMode == ViewMode.Ready'] > :nth-child(4) > :nth-child(1) div", 'Corporate main email provider:');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click("[id='s2id_autogen15'] b");
  //TODO Please add an assertion here
await isVisible(page, "#select2-drop > ul");
  await Validate_email_provider_list();
  await page.click("#select2-drop-mask");
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function close_tab___choose_relevant_tab_in_context() {
  await close_tab();
}

async function Close_settings_tab() {
  await close_tab___choose_relevant_tab_in_context();
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

async function UK_Rail__Evolvi__rountrip_search(from, to) {
  await page.click(".el-tabs__header .el-input");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.waitFor(1000);
  await page.type("[aria-activedescendant^='el-autocomplete']", from);
  await sendSpecialCharacter(page, "#el-id-4295-1096", 'Tab');
  await page.click("[id='pane-rails'] [placeholder='Depart Date']");
  await page.dblclick(".el-zoom-in-top-enter-from [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9009-999'] tbody > :nth-child(3) > :nth-child(7)");
  await page.type("[aria-activedescendant='el-autocomplete-9190-item--1']", to);
  await sendSpecialCharacter(page, "#el-id-4295-1101", 'Tab');
  await page.click("[placeholder='Pick-up date']");
  await page.click("[id='el-id-5512-76'] tbody > :nth-child(4) > :nth-child(3)");
  await page.waitForSelector("[id^='el-id']", {state: "visible"});
  if (await isVisible(page, "form > :nth-child(4) > :nth-child(3) .el-checkbox__inner")) {
    await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  }
  await page.click(".search-btn");
}

async function Search_hotel_and_add_to_cart() {
  await page.click(".flicking-camera > :nth-child(2) .icon-text");
  await waitForText(page, ".atrs-edit-search-drawer [class^='ml'], [class*=' ml']", 'Available properties only');
  await page.click(".btn--size-large");
  await waitForText(page, ".hotel-list > :nth-child(2) .price-prefix [class^='gray'], [class*=' gray']", 'From');
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .price-prefix .muliSemiBold", 'Total price');
  await page.click("[id='el-id-8798-1581'] > :nth-child(2) .el-checkbox__inner");
  await waitForText(page, ".room-list > :nth-child(2) .room-rate-amenities p", 'Refundable');
  await page.click(".room-list > :nth-child(2) .btn--primary");
  await waitForText(page, ".flight-quote-card .has-text-weight-bold", 'Pending booking');
}

