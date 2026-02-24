/*
 * Test Name: 26954 MERGED can add guests (child, senior, youth, lap infant, seat infant) but cant proceed to search
 * Description: the user can add guest, birth date relevant to the type, tag bby the type, cant proceed to search (error message appears), can continue with request assistance, display 'please select gender' instead of 'preffer not to say'
 * Status: Active
 * Labels: multi PTC,guest,Adding Passengers,Regression,No Amadeus Hotel Book,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-08T02:01:40Z
 * Updated: 2026-01-15T12:23:29Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await child();
  await senior();
  await youth();
  await lap_infant();
  await seat_infant();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function add_guest___child_Amit_Israeli() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-9517-936 > span");
  await page.click("[class^='mb'], [class*=' mb'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-9517-920 > span");
  await page.type("[placeholder='First Name']", 'Amit');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '08/02/1986');
  await page.click("[placeholder='Enter email address']");
  await waitForText(page, ".help", 'This field is required');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '05/04/2020');
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'amit@israeli.com');
  await waitForText(page, "[placeholder='DD/MM/YYYY']", '05/04/2020');
  await page.click(".add-guest-btn");
}

async function validations() {
  await waitForText(page, ".ptc-text-style", 'Child');
  await waitForText(page, ".max-width-text-PTC > :nth-child(2)", /Online searches are currently available for adults only. For different user types please use/);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".page-view .icon-container");
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await waitForText(page, ".ptc-text-style", 'Child');
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

async function child() {
  await book_a_new_trip();
  await add_guest___child_Amit_Israeli();
  await validations();
  await close_tab___choose_relevant_tab_in_context();
}

async function add_guest___senior_Avraham_Israeli() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("[class^='mb'], [class*=' mb'] .el-select__caret");
  await page.click("#el-id-7714-920 > span");
  await page.type("[placeholder='First Name']", 'Avraham');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '08/02/1986');
  await page.click("[placeholder='Enter email address']");
  await waitForText(page, ".help", 'This field is required');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '06/03/1950');
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'avraham@israeli.com');
  await waitForText(page, "[placeholder='DD/MM/YYYY']", '06/03/1950');
  await page.click(".add-guest-btn");
}

async function validations_1() {
  await waitForText(page, ".ptc-text-style", 'Senior');
  await waitForText(page, ".max-width-text-PTC > :nth-child(2)", /Online searches are currently available for adults only. For different user types please use/);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".page-view .icon-container");
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await waitForText(page, ".ptc-text-style", 'Senior');
}

async function senior() {
  await book_a_new_trip();
  await add_guest___senior_Avraham_Israeli();
  await validations_1();
  await close_tab___choose_relevant_tab_in_context();
}

async function add_guest___youth_Ido_Israeli() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("[class^='mb'], [class*=' mb'] .el-select__caret");
  await page.click("#el-id-9871-920 > span");
  await page.type("[placeholder='First Name']", 'Ido');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '08/02/1986');
  await page.click("[placeholder='Enter email address']");
  await waitForText(page, ".help", 'This field is required');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '08/07/2010');
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'ido@israeli.com');
  await waitForText(page, "[placeholder='DD/MM/YYYY']", '08/07/2010');
  await page.click(".add-guest-btn");
}

async function validations_2() {
  await waitForText(page, ".ptc-text-style", 'Youth');
  await waitForText(page, ".max-width-text-PTC > :nth-child(2)", /Online searches are currently available for adults only. For different user types please use/);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".page-view .icon-container");
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await waitForText(page, ".ptc-text-style", 'Youth');
}

async function youth() {
  await book_a_new_trip();
  await add_guest___youth_Ido_Israeli();
  await validations_2();
  await close_tab___choose_relevant_tab_in_context();
}

async function add_guest___lap_infant_Rotem_Israeli() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(5) span");
  await page.click("[class^='mb'], [class*=' mb'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4956-920 > span");
  await page.type("[placeholder='First Name']", 'Rotem');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '08/02/1986');
  await page.click("[placeholder='Enter email address']");
  await waitForText(page, ".help", 'This field is required');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '02/01/2026');
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'rotem@israeli.com');
  await waitForText(page, "[placeholder='DD/MM/YYYY']", '02/01/2026');
  await page.click(".add-guest-btn");
}

async function validations_3() {
  await waitForText(page, ".ptc-text-style", 'Lap Infant');
  await waitForText(page, ".max-width-text-PTC > :nth-child(2)", /Online searches are currently available for adults only. For different user types please use/);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".page-view .icon-container");
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await waitForText(page, ".ptc-text-style", 'Lap Infant');
}

async function lap_infant() {
  await book_a_new_trip();
  await add_guest___lap_infant_Rotem_Israeli();
  await validations_3();
  await close_tab___choose_relevant_tab_in_context();
}

async function add_guest___seat_infant_Shaked_Israeli() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(6) span");
  await page.click("[class^='mb'], [class*=' mb'] .el-select__caret");
  await page.click("#el-id-3242-921 > span");
  await page.type("[placeholder='First Name']", 'Shaked');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '08/02/1986');
  await page.click("[placeholder='Enter email address']");
  await waitForText(page, ".help", 'This field is required');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.type("[placeholder='DD/MM/YYYY']", '10/03/2025');
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'shaked@israeli.com');
  await waitForText(page, "[placeholder='DD/MM/YYYY']", '10/03/2025');
  await page.click(".add-guest-btn");
}

async function validations_4() {
  await waitForText(page, ".ptc-text-style", 'Seat Infant');
  await waitForText(page, ".max-width-text-PTC > :nth-child(2)", /Online searches are currently available for adults only. For different user types please use/);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".page-view .icon-container");
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await waitForText(page, ".ptc-text-style", 'Seat Infant');
}

async function seat_infant() {
  await book_a_new_trip();
  await add_guest___seat_infant_Shaked_Israeli();
  await validations_4();
}

