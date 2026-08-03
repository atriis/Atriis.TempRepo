# Test Name: 82129 hotel appears first and highlighted when search for specific hotel
# Status: Design
# Labels: Expedia,Hotel,search,Regression

@regression @provider:expedia
Feature: 82129 Expedia - Searched hotel appears first and is highlighted in results
  As a corporate traveler
  I want the specific hotel I searched for to appear first and be highlighted
  So that I can immediately identify the hotel I was looking for in the results

  @priority:medium
  Scenario: Searched specific hotel appears first and is highlighted
    Given I am logged in as "expedia@only.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Gwesty Guest House" for 1 night
    And I wait to see view rates text in results page
    Then the hotel at position 1 should be "Gwesty Guest House"
    Then the hotel at position 1 should be highlighted
