/*
 * Test Name: 31371 MERGED BI permissions
 * Description: case 1 - (shani@testimcorpnl.com) corporate user with subscription to BI reports and with privilege "Can view corporate reports" can see the link to the BI reports 
case 2- (shani@perfo.com)
corporate user without subscription and with privileges cant see the report
case 3 - (Nobi@Access.com) corporate user with subscription and without privileges cant see the report
case 4 - (Bilha@Useron.com) corporate user with subscription and with privilege "can view user group reports" can see the report
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-12-19T07:55:02Z
 * Updated: 2023-12-19T09:06:31Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await case_1();
  await case_2();
  await case_3();
  await case_4();
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

async function case_1() {
  await Login('shani@testimcorpnl.com');
  await page.click("[title='Reports'] .material-symbols-outlined");
  await waitForText(page, "[title='Corporate']", 'Corporate');
  await close_tab___choose_relevant_tab_in_context();
  await page.click(".logout-icon");
  await page.click("a");
}

async function case_2() {
  await Login('shani@perfo.com');
  await waitForText(page, "h3", 'Recently Updated');
  await waitForText(page, "h1", /Welcome/);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click(".logout-icon");
  await page.click("a");
}

async function case_3() {
  await Login('Nobi@Access.com');
  await waitForText(page, "h3", 'Recently Updated');
  await waitForText(page, "h1", /Welcome/);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click(".logout-icon");
  await page.click("a");
}

async function case_4() {
  await Login('Bilha@Useron.com');
  await page.click("[title='Reports'] .material-symbols-outlined");
  await waitForText(page, "[title='Corporate']", 'Corporate');
}

