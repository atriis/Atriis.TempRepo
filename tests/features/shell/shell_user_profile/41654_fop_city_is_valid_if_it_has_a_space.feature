# Test Name: 41654 Form of payment - City is valid if it has a "space"
# Description:
# Status: Active
# Labels: Profile,Regression,FOP,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-25T02:51:04Z
# Updated: 2025-07-14T07:26:56Z

@regression @profile @fop
Feature: 41654 FOP - City field is valid when it contains a space
  As a corporate traveler
  I want to add a credit card with a city name that contains a space
  So that multi-word city names like "New York City" are accepted

  @priority:medium
  Scenario: Add credit card with city name containing a space and delete it
    Given I am logged in as "analucia@cardadmin.com"
    When I navigate to my user profile
    And I open the form of payment tab in my profile
    And I remove all existing credit cards from my profile
    And I add a new credit card with city "new york city" and cardholder "testim"
    Then I should see a success notification
    And the card holder name "testim" should be displayed
    When I delete the credit card from my profile
    Then the credit card should be removed
