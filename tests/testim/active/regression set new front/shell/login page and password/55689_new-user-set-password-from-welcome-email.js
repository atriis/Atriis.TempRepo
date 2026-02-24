/*
 * Test Name: 55689 - New user, Set password from welcome email
 * Description: 
 * Status: Active
 * Labels: Login Page,Password,Email,Regression,Daily Shell,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-12-20T10:04:54Z
 * Updated: 2025-08-19T01:44:44Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('reset@password.com');
  await Navigate_to_corporate_settings();
  await Select_Forgot_password__and_send_reset_link('resetpw@pax5.com');
  await click_on_a_link_in_the_last_mail(1);
  await Validate_email_sent__extract_reset_password_link();
  await Navigate_to_reset_password_page();
  await Validate_reset_password_page_displayed();
  await Select_new_password();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function Navigate_to_corporate_settings() {
  await waitForText(page, ".btn--primary", 'Start New Trip');
  await page.click(".expense-container .material-symbols-outlined");
}

async function Add_new_user() {
  await page.click("[title='Users']");
  await waitForText(page, ".body-container tbody > :nth-child(2) [ng-hide='user.DeletionDate && user.DeletionDate!=null']", 'Active');
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[data-ng-click='onAddNewUserClicked()'] span");
  await page.click("[id='s2id_autogen61'] b");
  await page.click("#select2-drop > ul > li.select2-results-dept-0.select2-result.select2-result-selectable.ng-binding.ng-scope.select2-highlighted > div");
  await page.click("[data-ng-model='user.FirstName']");
  await page.type("[data-ng-model='user.FirstName']", randomFN);
  await page.click("[data-ng-model='user.LastName']");
  await page.type("[data-ng-model='user.LastName']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'email-generator' step has to be done manually at this time
  await page.click("[ng-pattern='/^[a-zA-Z0-9._%\\-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/']");
  await page.type("[ng-pattern='/^[a-zA-Z0-9._%\\-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/']", userEmail);
  await page.click("#s2id_autogen71 > a");
  await page.click("#select2-drop > ul > li > div");
  await page.click("[task='onSaveClicked'] .ng-scope");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Send_welcome_email() {
  await page.click("[ng-disabled='isDisabled']");
  await page.type("[ng-disabled='isDisabled']", randomFN + " " + randomLN);
  await waitForText(page, ".user-scroll-corporate [ng-hide='user.DeletionDate && user.DeletionDate!=null']", 'Active');
  await page.waitFor(1000);
  await page.click("[ng-model='user.IsChecked']");
  await page.click("[data-ng-click='onSendWelcomeEmailClicked()'] span");
  await waitForText(page, ".toast-title", 'Welcome Email');
}

async function Select_Forgot_password__and_send_reset_link(username) {
  await waitForText(page, "[perdiems='perdiems'] > :nth-child(2) > :nth-child(8) label", 'Travel policy  (Optional)');
  await Add_new_user();
  await Send_welcome_email();
}

async function click_on_a_link_in_the_last_mail(linkNumber) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function Validate_email_sent__extract_reset_password_link() {
  if (true) {
    return;
  }
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function Navigate_to_reset_password_page() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    // Function to process the email link and navigate to the reset password page
    function processEmailLink() {
        try {
            // Check if emailLink is already declared and it's either an object or a valid JSON string
            if (!emailLink) {
                throw new Error("emailLink is not declared or is empty.");
            }
    
            // If emailLink is already an object, no need to parse it
            let linkData;
            if (typeof emailLink === 'string') {
                // Parse it only if it's a string (JSON string)
                linkData = JSON.parse(emailLink); // Parsing the emailLink string to JSON object
            } else if (typeof emailLink === 'object') {
                // If it's already an object, just use it directly
                linkData = emailLink;
            } else {
                throw new Error("emailLink is neither a valid string nor a valid object.");
            }
    
            // Check if the object contains the 'link' key
            if (linkData && linkData.link) {
                const resetPasswordLink = linkData.link;
    
                // Log the reset password link for debugging
                console.log("Navigating to the password reset link:", resetPasswordLink);
    
                // Navigate to the password reset link in the same tab
                window.location.href = resetPasswordLink;
            } else {
                // If the 'link' key is not found or is invalid
                console.error("No valid reset password link found in the email link data.");
                throw new Error("No valid reset password link found.");
            }
        } catch (error) {
            // Handle any errors that occur during parsing or navigation
            console.error("Error processing email link:", error);
            throw new Error("Failed to process email link.");
        }
    }
    
    // Call the function to process the email link
    processEmailLink();
  });
}

async function Validate_reset_password_page_displayed() {
  await waitForText(page, "h1", 'Enter new password');
  //TODO Please add an assertion here
await isVisible(page, ".logo img");
  //TODO Please add an assertion here
await isVisible(page, "#newPasswordTextBox");
  //TODO Please add an assertion here
await isVisible(page, "#firstPage");
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Select_new_password() {
  await page.click("#newPasswordInput");
  await page.type("#newPasswordInput", 'Atriis');
  //TODO Please add an assertion here
await isVisible(page, "#lowercase");
  //TODO Please add an assertion here
await isVisible(page, "#uppercase");
  await page.type("#newPasswordInput", 'Atriis2024');
  //TODO Please add an assertion here
await isVisible(page, "#number");
  //TODO Please add an assertion here
await isVisible(page, "#eight");
  await page.type("#newPasswordInput", 'Atriis2024!');
  //TODO Please add an assertion here
await isVisible(page, "#confirmPasswordInput");
  await page.click("#confirmPasswordInput");
  await page.type("#confirmPasswordInput", 'Atriis2025!');
  await waitForText(page, ".form-text", 'The password confirmation does not match');
  await page.type("#confirmPasswordInput", 'Atriis2024!');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click("#confirmText");
  await waitForText(page, ".trips-title .trips-subtitle", 'How would you like to start your next trip?');
  if (false) {
    await waitForText(page, "#btnSubmit", 'Log in');
  }
}

