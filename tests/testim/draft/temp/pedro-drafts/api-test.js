/*
 * Test Name: api test
 * Description: PendingApprovalTrips
 * Status: Draft
 * Labels: 
 * Owner: Pedro Carneiro
 * Created: 2025-07-21T04:49:09Z
 * Updated: 2025-10-03T11:33:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await writeVal_1();
  await API_Validation__AuthForAPi('shani@nl.com', 'ImStuckInPT24!', '58294d71f764436fa8282de44cb90cfd');
  await API_Validation__Amtrak_GetTrip(3515718, 275909);
  await saveAPI();
  await browser.close();
})();

// shared steps \\
async function getToken() {
  await page.evaluate(() => {
    const hash = window.location.hash;
    
    if (!hash.includes("access_token")) {
      throw new Error("Token não encontrado na URL: " + window.location.href);
    }
    
    const token = hash.match(/access_token=([^&]+)/)[1];
    const type = hash.match(/token_type=([^&]+)/)[1];
    
    exportsTest.google_token = token;
    console.log("Token salvo como GOOGLE_TOKEN");
    
  });
}

async function writeValue() {
  await getToken();
}

async function AuthGoogleToken() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function writeVal() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function writeVal_1() {
  await page.goto('https://atriis.sharepoint.com/:x:/r/sites/development/_layouts/15/doc2.aspx?sourcedoc=%7BEF087F78-4511-4B5D-87A7-8B1C1F5241C9%7D&file=QA%20-%20carCurrency%20takes%20the%20supplier%20original%20currency%20value%20and%20not%20the%20user-%20the%20value%20itself%20is%20correct%20-%20DEV%20P.4%20-%20C%C3%B3pia.xlsx&action=default&mobileredirect=true');
  await writeValue();
  await AuthGoogleToken();
  await writeVal();
}

async function API_Validation__AuthForAPi(username, password, SubscriptionKey) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Amtrak_GetTrip(TripId, AgencyId) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function AuthGoogleToken_1() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function writeVal_2() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function writeVal_3() {
  await page.goto('https://accounts.google.com/o/oauth2/v2/auth?client_id=871409406029-7bq7uk5mbgf3sraqeqbl5ebfgk9kt9ii.apps.googleusercontent.com&redirect_uri=https://developers.google.com/oauthplayground&response_type=token&scope=https://www.googleapis.com/auth/spreadsheets&include_granted_scopes=true&state=xyz');
  await AuthGoogleToken_1();
  await writeVal_2();
}

async function saveAPI() {
  await writeVal_3();
}

