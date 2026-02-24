/*
 * Test Name: 63183 BenerailMoove> Validate improvements on autocomplete
 * Description: Validate improvements on autocomplete
 * Status: Active
 * Labels: Regression,Benerail Moove Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-06-06T03:32:48Z
 * Updated: 2025-12-23T04:49:29Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Testim@benemoove.com');
  await Book_a_new_trip();
  await page.click(".nested-tabs-select span");
  await page.click("#el-id-2070-26 > span");
  await Validating_improvements_on_autocomplete();
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

async function Book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function Validating_improvements_on_autocomplete() {
  await page.type("#el-id-7113-139", 'Bruxelles-Meiser');
  await waitForText(page, ".autocomplete-result-text .ellipsis", 'Bruxelles-Meiser (BE) - (BEMEI)');
  await page.type("#el-id-7113-139", 'Bruxelles Meiser');
  await waitForText(page, "[id='el-id-7113-31-item-6'] p", 'Bruxelles-Meiser (BE) (BEMEI)');
  await page.type("#el-id-7113-139", 'Brussels Meiser');
  await waitForText(page, ".autocomplete-result-text .ellipsis", 'Bruxelles-Meiser (BE) - (BEMEI)');
  await page.type("#el-id-7113-139", 'Brussel Meiser');
  await waitForText(page, ".autocomplete-result-text .ellipsis", 'Bruxelles-Meiser (BE) - (BEMEI)');
  await page.type("#el-id-7113-139", 'Brussel');
  await waitForText(page, "[id='el-id-7113-31-item-6'] p", 'Bruxelles-Meiser (BE) - (BEMEI)');
  await waitForText(page, "[id='el-id-7113-31-item-0'] p", 'Brussels Airport-Zaventem (BE) - (BEABT)');
  await page.type("#el-id-7113-139", 'Bruxelle');
  await waitForText(page, "[id='el-id-7113-31-item-6'] p", 'Brussels Airport-Zaventem (BE) - (BEABT)');
  await page.type("#el-id-7113-139", 'Bruxelles');
  await waitForText(page, "[id='el-id-7113-31-item-6'] p", 'Brussels Airport-Zaventem (BE) - (BEABT)');
  await page.type("#el-id-7113-139", 'Brussel Meiser');
  await waitForText(page, "[id='el-id-7113-31-item-6'] p", 'Bruxelles-Meiser (BE) - (BEMEI)');
  await page.type("#el-id-7113-139", 'Meiser');
  await waitForText(page, "[id='el-id-7113-31-item-6'] p", 'Bruxelles-Meiser (BE) - (BEMEI)');
}

