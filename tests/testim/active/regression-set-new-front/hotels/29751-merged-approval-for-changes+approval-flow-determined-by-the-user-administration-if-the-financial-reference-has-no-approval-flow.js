/*
 * Test Name: 29751 MERGED approval for changes + approval flow determined by the user administration if the financial reference has no approval flow
 * Description: 
 * Status: Active
 * Labels: Email,Approval flow,Approval for changes,Hotel,Cars,Full Purchase,Regression,NL government,Financial Reference Code,Pre Prod,Sanity,Amadeus,Transportation,Giata,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-12-17T08:44:58Z
 * Updated: 2025-10-28T08:42:40Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('Ami@leshin.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('lax');
  await click_on_proceed_after_search();
  await add_hotel_from_search_results_to_cart();
  await waitForText(page, ".payments-title", 'Trip overview');
  await scrollTo(page, 0, 200);
  await choose_payment_method();
  await set_CVV_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await select_first_financial_reference();
  await send_for_approvals_and_go_back_to_trip_overview();
  await waitForText(page, ".text--bold", 'Confirmed');
  await skip_approvers_of_first_approval_flow();
  await search_car_from_cart();
  await add_car_from_results_page_to_cart();
  await Accept_and_proceed_to_checkout();
  await send_for_approvals_amd_go_back_to_trip_overview();
  await validate_approver_in_approval_for_changes();
  await validate_approver_email();
  await click_on_approve(4);
  await page.waitFor(15000);
  await validate_new_message_on_approval();
  await refresh_tab();
  await validate_approvers();
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
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
}

function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}

async function scrollToElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, selector);
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

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function loop() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

async function click_refundable_hotel() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    let refundableRoom=document.querySelector(".refundable.cancellation-terms");
    refundableRoom.parentElement.parentElement.parentElement.parentElement.children[1].firstChild.firstChild.firstChild.children[2].click()
  });
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
  await Pending_Booking___Wait_for_element_text();
  await waitForText(page, ".ticket-top-section p", 'Refundable');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function choose_payment_method() {
  if (await getText(page, ".card-title") !== "'Payment Method'") {
    return;
  }
  await page.click(".quote-extras--payment-method .is-clickable");
  await page.click(".el-radio__inner");
  await page.click(".tabs-container .no-border");
  await Success_toast_alert();
}

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function select_first_financial_reference() {
  await waitForText(page, ".is-capitalized", 'Financial Reference');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1763-1419 > span");
  await page.click("body > :nth-child(19) .btn--primary");
}

async function click_on_submit_for_approval() {
  await page.click("[class^='btn--width'], [class*=' btn--width']");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function send_for_approvals_and_go_back_to_trip_overview() {
  await click_on_submit_for_approval();
  await Click_Go_to_Trip();
}

async function view_approvers_in_trip_overview() {
  await page.hover(".share-btn");
  await page.click(".share-popper > :nth-child(1)");
}

async function skip_approvers_of_first_approval_flow() {
  await waitForText(page, "[class^='px'], [class*=' px']", 'Terms & Conditions');
  await view_approvers_in_trip_overview();
  await page.click("body > :nth-child(13) .btn");
  await page.click(".btns-container > :nth-child(1)");
  await page.click("body > :nth-child(13) [class^='ml'], [class*=' ml']");
  await waitForText(page, ".status-desc", 'No pending items - you\'re up to date.');
  await waitForText(page, "#el-collapse-head-1100 > p", /Approved on/);
  if (false) {
    await waitForText(page, "#pane-active-approvers > div", 'No active approval flow');
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, ".p5 > :nth-child(2)", 'Approved by:Beny cohen ,Olga Cohen ,mali Cohen ');
  }
  await page.click("body > :nth-child(13) .el-dialog__close");
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

async function search_car_from_cart() {
  await page.click(".flicking-camera > :nth-child(3) .icon-text");
  await page.click("[valuekey='value']");
  await page.type("[valuekey='value']", 'JFK');
  await page.click("[role='region'] .has-text-weight-bold");
  await page.click("[placeholder='Pick-up Date']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(4) span");
  await page.click("[placeholder='Pick-up Time']");
  await page.click("[id='el-id-552-1690'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex();
  await page.click("#el-id-552-2260");
  await page.click(".trip-search-control");
  if (false) {
    await page.click("[id='el-id-7719-71'] .btn-apply");
  }
  if (false) {
    await page.waitFor(1000);
  }
  await page.click("[placeholder='Drop-off Date']");
  await page.click("[id='el-id-5903-290'] tbody > :nth-child(5) > :nth-child(5)");
  await page.waitFor(500);
  await page.click("h3");
  await page.click("#el-id-2437-106");
  await page.click("[id='el-id-552-1725'] [class^='mr'], [class*=' mr'] [fill='currentColor']");
  await getTheOpenListIndex();
  await page.click("#el-id-552-2482");
  await page.click("h3");
  if (false) {
    await page.click("[id='el-id-7719-106'] .btn-apply");
  }
  await page.click(".search-btn");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function send_for_approvals_amd_go_back_to_trip_overview() {
  await waitForText(page, "#el-collapse-head-5491 > div > span", 'Travellers Reference Questions');
  await click_on_submit_for_approval();
  await Click_Go_to_Trip();
  await waitForText(page, ".car-quote-card .more-details .is-flex", /More details/);
}

async function validate_approver_in_approval_for_changes() {
  await view_approvers_in_trip_overview();
  await waitForText(page, "#el-id-569-1515 > section > div:nth-child(1) > div > p", 'Awaiting approval');
  await waitForText(page, ".approver-name", 'Pini Cohen');
  await waitForText(page, "[id='pane-active-approvers'] .material-symbols-outlined", 'directions_car');
  await waitForText(page, ".active", 'ACTIVE');
  await waitForText(page, ".status-desc", /Received request for approval on/);
  // Converting a 'validation-code-step' step has to be done manually at this time
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 1 more to go...');
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, ".p5 > :nth-child(2)", 'Approved by:Beny cohen ,Olga Cohen ,mali Cohen ');
  }
  if (false) {
    await waitForText(page, "[id='pane-approved-approvers'] .material-symbols-outlined", 'domain');
  }
  if (false) {
    await waitForText(page, "[id='pane-approved-approvers'] .status-desc", /Approved on/);
  }
  await waitForText(page, ".approval-history-container .sub-title", 'Approval history');
  await waitForText(page, "#el-collapse-head-1540 > p", /Approved on/);
  await page.click("#el-collapse-head-1540 > p");
  await waitForText(page, "[id='el-collapse-content-1540'] .small-title", 'Approved by:');
  await waitForText(page, ".approvers-list-wrapper .is-flex", 'Beny cohen /Olga Cohen /mali Cohen');
  await waitForText(page, ".approval-history-container .material-symbols-outlined", 'domain');
  await page.click("body > :nth-child(16) .el-dialog__close");
}

async function validate_approver_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function click_on_approve(linkNumber) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function validate_new_message_on_approval() {
  await waitForText(page, ".approval-title", 'Trip approved!');
  await waitForText(page, ".material-symbols-outlined", 'check_circle');
  await waitForText(page, ".approve-txt", 'Great! The trip is now progressing to the next step.');
}

async function refresh_tab() {
  await page.reload();
}

async function validate_approvers() {
  await waitForText(page, ".car-quote-card .more-details .is-flex", /More details/);
  await view_approvers_in_trip_overview();
  if (false) {
    await waitForText(page, "#pane-active-approvers > div", 'No active approval flow');
  }
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", /Approved/);
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, "body > :nth-child(17) .hotel", 'domain');
  }
  if (false) {
    await waitForText(page, "[id='pane-approved-approvers'] .step-container > :nth-child(1) > :nth-child(1) .status-desc", /Approved on/);
  }
  if (false) {
    await waitForText(page, "#pane-approved-approvers > div > div > div > div:nth-child(1) > div:nth-child(2)", 'Approved by:Beny cohen ,Olga Cohen ,mali Cohen ');
  }
  if (false) {
    await waitForText(page, "body > :nth-child(17) .car", 'directions_car');
  }
  if (false) {
    await waitForText(page, "[id='pane-approved-approvers'] .step-container > :nth-child(1) > :nth-child(2) .status-desc", /Approved on/);
  }
  if (false) {
    await waitForText(page, "#pane-approved-approvers > div > div > div > div:nth-child(2) > div:nth-child(2)", 'Approved by:Pini Cohen ');
  }
  await waitForText(page, ".el-dialog__title", 'Trip approval');
  await waitForText(page, ".status-desc", 'No pending items - you\'re up to date.');
  await waitForText(page, "body > :nth-child(20) .sub-title", 'Approval history');
  await waitForText(page, "#el-collapse-head-83 > p", /Approved on/);
  await page.click("#el-collapse-head-83 > p");
  await waitForText(page, "[id='el-collapse-content-83'] .material-symbols-outlined", 'domain');
  await waitForText(page, "[id='el-collapse-content-83'] .small-title", 'Approved by:');
  await waitForText(page, "[id='el-collapse-content-83'] [class^='is-size'], [class*=' is-size']", 'Beny cohen /Olga Cohen /mali Cohen');
  await page.click("#el-collapse-head-84 > p");
  await waitForText(page, "body > :nth-child(20) .car", 'directions_car');
  await waitForText(page, ".approvers-list", 'Pini Cohen');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("body > :nth-child(17) .el-dialog__close");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

