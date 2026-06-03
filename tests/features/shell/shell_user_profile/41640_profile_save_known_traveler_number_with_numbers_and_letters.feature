# Test Name: 41640 "My Profile" - It is possible to save known traveler number with numbers and letters
# Description:
# Status: Active
# Labels: Regression,Profile,known traveler,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-25T10:21:57Z
# Updated: 2025-07-14T07:33:12Z

@regression @profile @known-traveler
Feature: 41640 Profile - Save known traveler number with numbers and letters
  As a corporate traveler
  I want to save a known traveler number containing both numbers and letters
  So that my TSA PreCheck or Global Entry number is stored correctly

  @priority:medium
  Scenario: Save known traveler number with alphanumeric characters
    Given I am logged in as "ruimendes@amadeus.com"
    When I navigate to my user profile
    And I open the passports and visas tab in my profile
    And I enter a known traveler number with alphanumeric characters
    And I save the passports and visas changes
    Then I should see a success notification
    And the known traveler number should be saved correctly
