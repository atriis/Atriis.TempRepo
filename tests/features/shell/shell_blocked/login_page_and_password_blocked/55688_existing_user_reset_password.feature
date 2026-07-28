# Test Name: 55688 - Existing user, Reset password
# Description: Clone of 55688 - Existing user, Rest password
# Status: Active
# Labels: Login Page,Password,Email,Regression,Daily Shell,2026 plan 1
# Owner: Noam Miller
# Created: 2024-12-20T08:48:12Z
# Updated: 2025-01-23T12:02:18Z

@regression @shell @login @password
Feature: 55688 - Existing user, Reset password
  As an existing corporate user who has forgotten my password
  I want to request a reset link and set a new password from the reset email
  So that I can regain access to my account

  Scenario: Existing user resets the password from the reset email link
    Given I am on the login page
    # TODO: Create step to click the forgot password link (create App.clickForgotPassword in src/dsl/App.js)
    When I click the forgot password link
    # TODO: Create step to verify the return to login page link is displayed (create App.verifyReturnToLoginLink in src/dsl/App.js)
    Then the return to login page link should be displayed
    # TODO: Create step to request a password reset for an email (create App.requestPasswordReset in src/dsl/App.js)
    When I request a password reset for "resetpw@existing.com"
    # TODO: Create step to verify the password reset confirmation message (create App.verifyPasswordResetConfirmation in src/dsl/App.js)
    Then the password reset confirmation "please check your email." should be displayed
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
    # TODO: Create step to verify the login button is displayed (create App.verifyLoginButtonDisplayed in src/dsl/App.js)
    Then the login button "Log in" should be displayed
