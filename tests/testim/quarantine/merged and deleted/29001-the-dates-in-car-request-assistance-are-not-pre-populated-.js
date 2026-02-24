/*
 * Test Name: 29001 The dates in car request assistance are not pre populated 
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-04-14T12:09:07Z
 * Updated: 2023-12-19T02:39:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('book@htl.flt');
  await page.click(".flicking-camera > :nth-child(1) > :nth-child(3) .icon-text");
  await page.click(".page-view .icon-container");
  await page.click(".btns-list > :nth-child(3) .icon-text");
  await scrollTo(page, 0, 534);
  await waitForText(page, "[placeholder='Pick-up Date']", '');
  await waitForText(page, "[placeholder='Drop-off Date']", '');
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


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

