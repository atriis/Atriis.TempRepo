# Test Name: 54894 Cars - Drop off and pick up locations in cart match the ones from results page
# Description:
# Status: Active
# Labels: Cars,Regression,general,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-21T07:51:43Z
# Updated: 2025-05-14T08:22:33Z
@regression @cars
Feature: 54894 Cars - Drop off and pick up locations in cart match the ones from results page
  As a corporate traveler
  I want cart location details to match the selected car result
  So that pickup and drop-off information remains consistent

  @priority:high
  Scenario: Select a city result and compare pickup and drop-off locations between results and cart
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Emirates Stadium, Hornsey Road, London, UK"
    When I select the first city center pickup location
    When I click location details in the car results
    And I extract the pickup location address in location details
    And I extract the dropoff location address in location details
    And I click location details in the car results
    When I add a car from city center results to cart
    And the booking status should be "Pending booking"
    When I click location details in cart
    And I extract the pickup location address in cart location details
    And I extract the dropoff location address in cart location details
    Then pickup and drop-off locations match the captured result values
