# Test Name: 54549 Traveler Profile - Can add visa
# Description:
# Status: Active
# Labels: Profile,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-19T06:42:07Z
# Updated: 2025-09-14T09:36:37Z

@regression @profile @visa
Feature: 54549 Profile - Can add and delete visa
  As a corporate traveler
  I want to add and remove a visa from my profile
  So that my travel documents are up to date

  @priority:high
  Scenario: Add a visa to profile and then delete it
    Given I am logged in as "danrogers@amadeusdanrogers.com" booking a new trip
    And I have added myself as the traveler
    When I navigate to the passport and visa profile page from the traveler name
    And I add a visa with an expiration date and number "123456"
    Then I should see a success notification
    When I delete the visa from my profile
    Then I should see a success notification
