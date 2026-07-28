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
    When I log in triggering two-factor authentication as "Five@Attempts.com"
    Then the two-factor verification code prompt should be displayed
    When I enter an incorrect verification code
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    Then the verification code error "Code you provided is incorrect or expired." should be displayed
    When I enter an incorrect verification code
    Then the final attempt warning "Final chance to enter the correct code." should be displayed
    When I enter an incorrect verification code
    Then the welcome heading should contain "Welcome back"
    # The subtitle is per-corporation branding, resolved once the identity service knows the user.
    # The login page reached by the lockout redirect shows the wording below; a cold visit to the
    # base URL shows the unbranded "Sign in and start your trip" the manual test case quotes.
    And the login page subtitle "Sign in and start your business trip" should be displayed
