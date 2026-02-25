/*
 * Test Name: 55688 - Existing user, Reset password
 * Description: Clone of 55688 - Existing user, Rest password
 * Status: Active
 * Labels: Login Page,Password,Email,Regression,Daily Shell,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-12-20T08:48:12Z
 * Updated: 2025-01-23T12:02:18Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Select_Forgot_password__and_send_reset_link('resetpw@existing.com');
  await page.waitFor(30000);
  await click_on_a_link_in_the_last_mail(1);
  await Validate_email_sent__extract_reset_password_link();
  await OLD_Navigate_to_reset_password_page();
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
async function Select_Forgot_password__and_send_reset_link(username) {
  await waitForText(page, "p", 'Sign in and start your trip');
  await page.click("#forgotPsw");
  await waitForText(page, ".blueText", 'Return to login page');
  await page.click("#email");
  await page.type("#email", username);
  await page.click("#resetText");
  await waitForText(page, ".psw-sent", 'please check your email.');
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

async function OLD_Navigate_to_reset_password_page() {
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
  await waitForText(page, "#btnSubmit", 'Log in');
}

