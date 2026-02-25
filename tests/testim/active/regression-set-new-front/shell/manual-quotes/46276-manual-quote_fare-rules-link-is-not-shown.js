/*
 * Test Name: 46276 Manual quote - "Fare Rules" link is not shown
 * Description: 
 * Status: Active
 * Labels: Regression,Manual Quote,Fare Rules,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-05-22T07:58:13Z
 * Updated: 2025-10-21T11:40:32Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('camilacoelho@manualquotetravelpolicy.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_Manual_Quote_Flight_One_Way_LON_MAD();
  await On_Hold___Wait_for_element_text();
  await __Fare_Rules__link_is_not_shown();
  await Trip_Cancelation();
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

async function isVisible(page, selector) {
  try {
    const elementHandle = await page.$(selector);
    if(!elementHandle) {
      return false;
    }
    const elementBox = await elementHandle.boundingBox();
    return Boolean(elementBox);
  } catch(err) {
    return false;
  }
}

// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function refresh_tab_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await page.reload();
}

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function getTheOpenListIndex(element) {
  await page.evaluate((element) => {
    // Get the index of the currently visible (open) dropdown popper
    function getOpenDropdownIndex() {
        // 1. Select ALL dropdown popper containers using a common class.
        const allPoppers = document.querySelectorAll('.el-popper');
    
        // 2. Iterate through the collection to find the open one.
        for (let i = 0; i < allPoppers.length; i++) {
            const popper = allPoppers[i];
            
            // Get the value of the style attribute. If null, treat it as an empty string.
            const style = popper.getAttribute('style') || '';
    
            // 3. Check for the definitive "open" state: the style attribute MUST NOT contain "display: none".
            // This is more reliable than aria-hidden for visual visibility.
            if (!style.includes('display: none')) {
                
                // Return the 1-based index (i + 1)
                return i + 1;
            }
        }
    
        // Return 0 if no dropdown is currently found to be open/visible.
        return 0;
    }
    
    // Example of how to call the function and use the result
    const openIndex = getOpenDropdownIndex();
    
    // Log the result (or return it as a step output variable in your automation tool)
    console.log("The 1-based index of the open dropdown is:", openIndex);
    
    exportsTest.index = openIndex
    
    // return openIndex; // Uncomment this line if your automation tool requires a return value
  }, element);
}

async function Add_Manual_Quote_Flight_One_Way_LON_MAD() {
  await page.click(".is-capitalized");
  await waitForText(page, ".flight-number", 'Flight 1');
  await page.type("#el-id-1095-4118", 'lon');
  await page.click("[id='el-id-1095-3383-item-0'] .ellipsis");
  await page.click("#el-id-1095-3386");
  await page.click("[id='el-id-7956-3351'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex(".trip-app > :nth-child(1)");
  await page.click("[id^='el-id'] span");
  await page.click(".page-view .is-align-items-end");
  if (false) {
    await page.click("[id='el-id-1095-3387'] .btn-apply");
  }
  await page.type("#el-id-1095-4123", 'mad');
  await page.click("[id='el-id-1095-3477-item-0'] .has-text-weight-bold");
  await page.click("#el-id-1095-3480");
  await page.click("[id='el-id-472-3433'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex(".page-view > :nth-child(1)");
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='pane-flight'] h4");
  if (false) {
    await page.click("[id='el-id-7704-2568'] [name='minutes'] svg");
  }
  if (false) {
    await page.click("#el-id-7704-2587 > span");
  }
  if (false) {
    await page.click("[id^='el-id-1095-3481'] .btn-apply");
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("#el-id-1095-4119");
  await page.click("[id='el-id-1095-3385'] [aria-label='Next Month'] svg");
  await page.click("[id='el-id-1095-3385'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  if (false) {
    await page.type(".manual-quote-flight-segment > :nth-child(2) [placeholder='DD MM YYYY']", dateFromFlight);
  }
  await page.type("#el-id-1095-4128", '1235');
  await page.type("#el-id-1095-4132", 'rewq23');
  await page.type("#el-id-1095-4133", 'el al');
  await page.click("#el-id-1095-3779 > span");
  await page.type("#el-id-1095-3378", '1');
  await page.type("[name='tax']", '20');
  await page.type("#el-id-1077-2584", '5');
  await page.waitFor(2000);
  await page.click(".add-quote-btn");
}

async function On_Hold___Wait_for_element_text() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function __Fare_Rules__link_is_not_shown() {
  await scrollTo(page, 0, 318);
  await page.waitFor(5000);
  await page.click(".more-details-btn");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click("#el-drawer__title > button > i");
  await page.click(".price-breakdown-btn");
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click("#el-drawer__title > button > i");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

