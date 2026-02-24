/*
 * Test Name: Get Trip Validations
 * Description: 
 * Status: Draft
 * Labels: 
 * Owner: Unassigned
 * Created: 2023-02-01T02:00:28Z
 * Updated: 2023-06-15T01:22:43Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://3.gtp-staging.com");
  await API();
  await browser.close();
})();

// shared steps \\
async function Login_get_Token___save_to_param(API_username, API_password) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function Use_saved_Token_from_prev_step() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API() {
  await Login_get_Token___save_to_param('pini@amsalem.com', '^Atriis4Ever!^');
  await Use_saved_Token_from_prev_step();
  // Converting a 'validation-code-step' step has to be done manually at this time
}

