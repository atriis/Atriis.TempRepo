/*
 * Test Name: 36713 new user created by self registration - can't automate because doesn't work on incognito
 * Description: 
 * Status: Draft
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2024-01-30T07:57:54Z
 * Updated: 2024-02-25T09:06:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await page.goto('https://ui.gtp-staging.com/selfRegistration/276121/TESTIM%20dont%20change&title=&firstName=&middleName=&lastName=&email=&userName=');
  await validate_fields_in_registration_form();
  await fill_details_and_submit();
  await validate_email();
  await click_on_a_link_in_the_last_mail('1');
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
async function validate_fields_in_registration_form() {
  await waitForText(page, ".personal-info-container > :nth-child(1) > :nth-child(1) .label", 'Title');
  await page.click(".el-select__caret");
  await waitForText(page, ".el-scrollbar__view > :nth-child(1)", 'Mr.');
  await waitForText(page, ".el-scrollbar__view > :nth-child(2)", 'Mrs.');
  await waitForText(page, ".el-scrollbar__view > :nth-child(3)", 'Ms.');
  await waitForText(page, ".el-scrollbar__view > :nth-child(4)", 'Miss.');
  await waitForText(page, ".el-scrollbar__view > :nth-child(5)", 'Dr.');
  await waitForText(page, ".el-scrollbar__view > :nth-child(6)", 'Prof.');
  await page.click(".el-select__caret");
  await waitForText(page, ".personal-info-container > :nth-child(1) > :nth-child(2) .label", 'First Name                        as per passport');
  await waitForText(page, "[placeholder='First Name']", '');
  await waitForText(page, ".personal-info-container > :nth-child(2) > :nth-child(1) .label", 'Middle Name                        as per passport');
  await waitForText(page, "[placeholder='Middle Name']", '');
  await waitForText(page, ".personal-info-container > :nth-child(2) .mandatory", 'Last Name                        as per passport');
  await waitForText(page, "[placeholder='Last Name']", '');
  await waitForText(page, ".personal-info-container > :nth-child(3) > div:nth-of-type(1) .label", 'Email');
  await waitForText(page, ".personal-info-container > :nth-child(3) > :nth-child(1) [type='text']", '');
  await waitForText(page, ".personal-info-container > :nth-child(3) > div:nth-of-type(2) .label", 'Username');
  await waitForText(page, ".personal-info-container > :nth-child(3) > :nth-child(2) [type='text']", '');
}

async function fill_details_and_submit() {
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'email-generator' step has to be done manually at this time
  await page.click(".el-input--suffix");
  await page.click(".el-scrollbar__view > :nth-child(2)");
  await page.type("[placeholder='First Name']", firstName);
  await page.type("[placeholder='Middle Name']", middleName);
  await page.type("[placeholder='Last Name']", lastName);
  await page.type(".personal-info-container > :nth-child(3) > :nth-child(1) [type='text']", emailAddress);
  await page.type(".personal-info-container > :nth-child(3) > :nth-child(2) [type='text']", firstName+'@'+lastName+'.com');
  await page.click(".btn");
  await waitForText(page, ".success-message__title", 'Success');
  await waitForText(page, ".success-message__description", 'Form has been submitted succesfully');
}

async function validate_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function click_on_a_link_in_the_last_mail(linkNumber) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

