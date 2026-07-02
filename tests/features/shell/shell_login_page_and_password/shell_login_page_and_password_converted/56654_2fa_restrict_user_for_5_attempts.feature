# Test Name: 56654 2fa - Restrict user for 5 attempts
# Description:
# Status: Active
# Labels: Regression,Login Page,2fa,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-01-23T01:57:38Z
# Updated: 2025-09-16T08:37:08Z

@regression @shell @login @2fa
Feature: 56654 - 2fa - Restrict user for 5 attempts
  As the platform protecting a two-factor-enabled account
  I want to reject repeated incorrect verification codes and lock the attempt out after five tries
  So that the user is returned to the login page instead of gaining access

  Scenario: Five incorrect verification codes return the user to the login page
    # TODO: Create step to log in with a two-factor-enabled user so the verification code prompt appears (create App.loginTriggeringTwoFactor in src/dsl/App.js)
    When I log in triggering two-factor authentication as "Five@Attempts.com"
    # TODO: Create step to verify the two-factor verification code prompt is displayed (create App.verifyTwoFactorPrompt in src/dsl/App.js)
    Then the two-factor verification code prompt should be displayed
    # TODO: Create step to enter an incorrect verification code (create App.enterIncorrectVerificationCode in src/dsl/App.js)
    When I enter an incorrect verification code
    # TODO: Create step to verify the verification code error message (create App.verifyVerificationCodeError in src/dsl/App.js)
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    # TODO: Create step to verify the final attempt warning message (create App.verifyFinalAttemptWarning in src/dsl/App.js)
    Then the final attempt warning "Final chance to enter the correct code." should be displayed
    When I enter an incorrect verification code
    Then the welcome heading should contain "Welcome back"
    # TODO: Create step to verify the login page subtitle is displayed (create App.verifyLoginPageSubtitle in src/dsl/App.js)
    And the login page subtitle "Sign in and start your trip" should be displayed
