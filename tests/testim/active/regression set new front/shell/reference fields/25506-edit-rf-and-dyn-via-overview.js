/*
 * Test Name: 25506 Edit RF and DYN via overview
 * Description: Edit RF and DYN via overview
 * Status: Active
 * Labels: Reference Fields,Regression,piniTest,No Amadeus Hotel Book,2026 plan 1
 * Owner: pini harush
 * Created: 2023-02-16T01:33:00Z
 * Updated: 2025-09-07T07:59:32Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('can@edit.dyn');
  await Navigate_to_trips();
  await Navigate_to_the_specific_trip();
  await Editing_trip_reference_form();
  await Success_toast_alert();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function Navigate_to_trips() {
  await waitForText(page, ".trip-tabs-container .btn", 'All trips');
  await page.click(".trip-tabs-container .btn");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
}

async function Navigate_to_the_specific_trip() {
  await page.type("[placeholder='Location, trip or travellers']", '3222550');
  await waitForText(page, "#el-id-1637-90 > li:nth-child(3)", /Click here to expand/);
  await page.click("[class^='ml'], [class*=' ml']");
  await waitForText(page, ".trip-id", '3222550');
  await page.click(".app-label");
  await waitForText(page, ".other-products-quote-card .center-title", /DO NOT CANCEL/);
}

async function Editing_trip_reference_form() {
  await scrollToElement(page, ".payments-title");
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.hover("#el-id-7000-15 > span");
  await page.click("#el-id-7000-16 > li:nth-child(4)");
  await waitForText(page, "#el-collapse-head-373 > div > span", 'General Reference Questions');
  await waitForText(page, "body > :nth-child(27) .btn--primary", 'Edit');
  await page.click("body > :nth-child(27) .btn--primary");
  await page.type("[id='el-collapse-content-4251'] .traveler-questions > :nth-child(1) [type='text']", 'a2345');
  await page.click(".btn--primary");
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

