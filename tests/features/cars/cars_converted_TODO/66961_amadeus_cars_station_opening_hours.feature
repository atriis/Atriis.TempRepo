@transportation @cars @regression @provider:amadeus
Feature: Amadeus - Cars - Verify specific station opening hours

  As a traveler
  I want to verify that car rental station opening hours are correctly displayed
  So that I can plan my rental pickup time accordingly

  Scenario: Search for specific location and verify station opening hours are accurate
    Given I am logged in as "ruimariano"
    When I book a new trip
    And I add myself as the traveler
    And I select an enterprise rental agency
    And I search for cars at "Shipyard Dr @ Pettinaro Park Dr, Wilmington, DE, USA"
    And I wait for car results to load
    Then the station opening hours should be correctly displayed
