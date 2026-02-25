/*
 * Test Name: Create user API test
 * Description: Clone: PendingApprovalTrips
 * Status: Draft
 * Labels: 
 * Owner: Pedro Carneiro
 * Created: 2025-11-17T04:01:45Z
 * Updated: 2025-11-19T04:39:33Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await HR_Corp_Account_Creation_API_Validation("HRCorpAccountCreationTest");
  await browser.close();
})();

// shared steps \\
async function API_Validation__AuthForAPi(username, password, SubscriptionKey) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function Create_User() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function HR_Corp_Account_Creation_API_Validation(createCorpAccount) {
  await API_Validation__AuthForAPi('yael@gdg.com', 'NextLevelAtriis25!', '58294d71f764436fa8282de44cb90cfd');
  await Create_User();
}

