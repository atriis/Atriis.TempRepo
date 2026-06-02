# Test Name: 63539 Allow to select and unselect seat preference
# Description:
# Status: Active
# Labels: Daily Shell,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-06-17T07:07:33Z
# Updated: 2025-06-20T01:17:30Z

@regression @profile @travel-preferences @daily-shell
Feature: 63539 Profile - Select and unselect seat preference
  As a corporate traveler
  I want to select and unselect my seat preference in my travel preferences
  So that I can update my seating preferences as needed

  @priority:medium
  Scenario: Select a seat preference and then clear it
    Given I am logged in as "TECHNOLOGIESCH@e.com" booking a new trip
    And I have added myself as the traveler
    When I open the traveler profile from the traveler name
    And I open the travel preferences tab in my profile
    And I select a seat preference from the dropdown
    And I save the travel preferences
    Then the seat preference should be saved
    When I clear the seat preference selection
    Then the seat preference should be cleared
