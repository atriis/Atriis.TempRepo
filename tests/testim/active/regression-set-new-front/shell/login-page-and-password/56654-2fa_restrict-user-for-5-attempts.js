/*
 * Test Name: 56654 2fa - Restrict user for 5 attempts
 * Description: 
 * Status: Active
 * Labels: Regression,Login Page,2fa,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2025-01-23T01:57:38Z
 * Updated: 2025-09-16T08:37:08Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Copy_of_Login('Five@Attempts.com');
  await waitForText(page, "h4", /we've emailed you the verification code/);
  await enter_incorrect_code___first_time();
  await enter_incorrect_code___first_time_1();
  await enter_incorrect_code___second_time();
  await enter_incorrect_code___second_time_1();
  await enter_incorrect_code___second_time_2();
  await waitForText(page, "li", 'Final chance to enter the correct code.');
  await page.waitFor(1000);
  await enter_incorrect_code___fifth_time();
  await waitForText(page, "h1", 'Welcome back');
  await waitForText(page, "p", 'Sign in and start your trip');
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
async function Copy_of_Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'NextLevelAtriis25!');
  await page.click("#resetText");
}

async function enter_incorrect_code___first_time() {
  await page.type("#code", 'first');
  await page.click("#resetText");
  await waitForText(page, "li", 'Code you provided is incorrect or expired.');
  await page.waitFor(1000);
}

async function enter_incorrect_code___first_time_1() {
  await page.type("#code", 'second');
  await page.click("[type='submit']");
  await waitForText(page, "li", 'Code you provided is incorrect or expired.');
  await page.waitFor(1000);
}

async function enter_incorrect_code___second_time() {
  await page.type("#code", 'third');
  await page.click("[type='submit']");
  await waitForText(page, "li", 'Code you provided is incorrect or expired.');
  await page.waitFor(1000);
}

async function enter_incorrect_code___second_time_1() {
  await page.type("#code", 'fourth');
  await page.click("[type='submit']");
  await waitForText(page, "li", 'Code you provided is incorrect or expired.');
  await page.waitFor(1000);
}

async function enter_incorrect_code___second_time_2() {
  await page.type("#code", 'fifth');
  await page.click("[type='submit']");
}

async function enter_incorrect_code___fifth_time() {
  await page.type("#code", 'sixth');
  await page.click("[type='submit']");
}

