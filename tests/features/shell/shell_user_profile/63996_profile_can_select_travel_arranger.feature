# Test Name: 63996 Profile - Can select Travel Arranger
# Description:
# Status: Active
# Labels: Regression,Profile,Travel Arranger,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-25T12:50:08Z
# Updated: 2025-09-17T11:25:56Z

@regression @profile @travel-arranger
Feature: 63996 Profile - Can select travel arranger
  As a corporate traveler
  I want to select who can book for me and assign a travel arranger
  So that my booking permissions are correctly configured

  @priority:medium
  Scenario: Select and configure travel arranger in permissions tab
    Given I am logged in as "Stuart@Stuart.com"
    When I navigate to my user profile
    And I open the permissions tab in my profile
    And I open the "Who can I book for" section
    And I remove a user from the booking permissions list
    Then the user should be removed from the list
    When I add "rita franklin" as a travel arranger
    Then "Rita Franklin" should be displayed as the selected travel arranger
