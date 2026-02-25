/*
 * Test Name: 64738 [Amtrak][GetTrip] Amtrak quote clean-ups and missing fields
 * Description: 
 * Status: Active
 * Labels: Regression,APIS,Rail,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-07-16T03:28:33Z
 * Updated: 2025-12-05T04:59:42Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await API_Validation__AuthForAPi('yaelte@atriis.com', 'NextLevelAtriis25!', '58294d71f764436fa8282de44cb90cfd');
  await API_Validation__Amtrak_GetTrip(3515718, 275909);
  await browser.close();
})();

// shared steps \\
async function API_Validation__AuthForAPi(username, password, SubscriptionKey) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Amtrak_GetTrip(TripId, AgencyId) {
  // Converting a 'api-action' step has to be done manually at this time
}

