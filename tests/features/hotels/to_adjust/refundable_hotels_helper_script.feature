# Test Name: Refundable Hotels
# Description: a non refundable script. Not necessarily should be used, because after choosing a room, it can be filtered to refundable.
# Status: Active
# Labels: Helper
# Owner: Unassigned
# Created: 2022-12-18T02:04:48Z
# Updated: 2022-12-18T02:52:51Z

@regression @provider:general
Feature: Refundable Hotels - Helper script for refundable hotel selection
  As a QA engineer
  I want a helper test to select a refundable hotel from search results
  So that it can be used as a utility for other test scenarios

  @priority:low
  Scenario: Search and select a refundable hotel room
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the hotel should appear as refundable in my cart
