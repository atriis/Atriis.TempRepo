# Test Name: 53976 [Merge] Sabre - Car - When searching for can in city center, location name and address are displayed, and pick up and drop off locations are different when searching for different locations
# Description:
# Status: Active
# Labels: Regression,Sabre,Cars,merge,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-06T01:48:33Z
# Updated: 2025-07-16T05:58:08Z
@regression @cars @provider:sabre
Feature: 53976 Sabre city-center station details and different pickup and drop-off locations
  As a corporate traveler
  I want city-center search results to show station details and distinct locations
  So that different-location Sabre searches remain correct

  @priority:high
  Scenario: Search different pickup and drop-off locations and validate city-center station details
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car from "London,United Kingdom,(LON)" to "Oxford, UK"
    And I wait for select text to be visible
    Then I should see the location name and address displayed for all station results
    When I select the first city center pickup location
    Then I should see the location name and address displayed for all station results
    When I select the first city center dropoff location
    And I wait for add to trip text to be visible
    When I click location details in the car results
    And I extract the pickup location address in location details
    And I extract the dropoff location address in location details
    Then the pickup and dropoff locations should be different
