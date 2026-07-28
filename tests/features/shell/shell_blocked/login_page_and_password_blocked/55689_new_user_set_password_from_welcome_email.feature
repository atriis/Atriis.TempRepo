# Test Name: 55689 - New user, Set password from welcome email
# Description:
# Status: Active
# Labels: Login Page,Password,Email,Regression,Daily Shell,2026 plan 1
# Owner: Noam Miller
# Created: 2024-12-20T10:04:54Z
# Updated: 2025-08-19T01:44:44Z

@regression @shell @login @password
Feature: 55689 - New user, Set password from welcome email
  As an administrator onboarding a new corporate user
  I want to create the user, send a welcome email, and let them set a password from that email
  So that a brand new user can complete their first sign-in

  Scenario: New user sets a password from the welcome email link
    Given I am logged in as "reset@password.com"
    # TODO: Create step to navigate to corporate settings (create App.navigateToCorporateSettings in src/dsl/App.js — consider reusing Administration DSL)
    When I navigate to corporate settings
    # TODO: Create step to add a new user (Testim used random-value/date/email generators; needs App/Administration DSL with generated user data)
    When I add a new user
    # TODO: Create step to send a welcome email to the new user (create App.sendWelcomeEmail in src/dsl/App.js)
    When I send a welcome email to the new user
    # TODO: Create step to verify the welcome email confirmation toast (create App.verifyWelcomeEmailConfirmation in src/dsl/App.js)
    Then the welcome email confirmation "Welcome Email" should be displayed
    # TODO: Create step to open the password reset link from the last email (manual email-validation step in Testim; needs an email service/DSL)
    When I open the password reset link from the last email
    # TODO: Create step to verify the reset password page is displayed (create App.verifyResetPasswordPageDisplayed in src/dsl/App.js — asserts "Enter new password" heading, logo, and password fields)
    Then the reset password page should be displayed
    # TODO: Create step to enter a new password value (create App.enterNewPassword in src/dsl/App.js)
    When I enter the new password "Atriis"
    # TODO: Create step to verify a password strength rule is indicated as met (create App.verifyPasswordRuleMet in src/dsl/App.js)
    Then the password rule "lowercase" should be indicated as met
    And the password rule "uppercase" should be indicated as met
    When I enter the new password "Atriis2024"
    Then the password rule "number" should be indicated as met
    And the password rule "minimum length" should be indicated as met
    When I enter the new password "Atriis2024!"
    # TODO: Create step to verify the confirm password field is displayed (create App.verifyConfirmPasswordFieldDisplayed in src/dsl/App.js)
    Then the confirm password field should be displayed
    # TODO: Create step to confirm the new password value (create App.confirmNewPassword in src/dsl/App.js)
    When I confirm the new password "Atriis2025!"
    # TODO: Create step to verify the password mismatch message (create App.verifyPasswordMismatchMessage in src/dsl/App.js)
    Then the password mismatch message "The password confirmation does not match" should be displayed
    When I confirm the new password "Atriis2024!"
    # TODO: Create step to verify the password mismatch message is no longer displayed (Testim negative-element-validation; create App.verifyPasswordMismatchMessageAbsent in src/dsl/App.js)
    Then the password mismatch message should no longer be displayed
    # TODO: Create step to submit the new password (create App.submitNewPassword in src/dsl/App.js)
    When I submit the new password
    # TODO: Create step to verify the new trip prompt is displayed after setting the password (create App.verifyNewTripPrompt in src/dsl/App.js)
    Then the new trip prompt "How would you like to start your next trip?" should be displayed
