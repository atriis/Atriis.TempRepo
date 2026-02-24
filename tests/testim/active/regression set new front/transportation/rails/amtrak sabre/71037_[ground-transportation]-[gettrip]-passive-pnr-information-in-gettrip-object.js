/*
 * Test Name: 71037  [Ground Transportation] [GetTrip] Passive PNR information in GetTrip Object
 * Description: Clone: 
 * Status: Active
 * Labels: Regression,APIS,Rail,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-12-05T04:25:08Z
 * Updated: 2026-01-09T05:22:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await API_Validation__AuthForAPi('pmac@tmc.gdg', 'NextLevelAtriis25!', '58294d71f764436fa8282de44cb90cfd');
  await API_Validation__Amtrak_GetTrip(3584840, 274129);
  await browser.close();
})();

// shared steps \\
async function API_Validation__AuthForAPi(username, password, SubscriptionKey) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Amtrak_GetTrip(TripId, AgencyId) {
  // Converting a 'api-action' step has to be done manually at this time
}

