# Test Name: 69791 Login with invalid credentials, successful login with valid credentials, and logout validation
# Description:
# Status: Active
# Labels: Regression,Login Page,Logout,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-04T04:12:24Z
# Updated: 2025-11-04T04:29:54Z

@regression @shell @login
Feature: 69791 - Login with invalid credentials, successful login with valid credentials, and logout validation
  As a corporate user
  I want the application to reject invalid credentials, accept valid ones, and return me to the login page after logout
  So that authentication behaves correctly for both failed and successful sign-in attempts

  Scenario: Invalid login is rejected, valid login succeeds, and logout returns to the login page
    When I attempt to log in with invalid credentials as "ruimar1anoo@testfail.com"
    Then the login error message "Login failed. Please check your credentials or use your organization's login method." should be displayed
    When I am logged in as "ruimariano@amadeus.com"
    Then the welcome heading should contain "Welcome Rui Mariano"
    When I click the logout icon
    Then the logout confirmation message "You've been logged out successfully! Please click here if you are not redirected within a few seconds." should be displayed
    And the login page should be displayed again
