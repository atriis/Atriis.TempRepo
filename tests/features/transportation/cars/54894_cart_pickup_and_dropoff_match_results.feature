# Test Name: 54894 Cars - Drop off and pick up locations in cart match the ones from results page
# Description:
# Status: Active
# Labels: Cars,Regression,general,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-21T07:51:43Z
# Updated: 2025-05-14T08:22:33Z
@regression @cars
Feature: 54894 Cart pickup and drop-off locations match the results page
  As a corporate traveler
  I want cart location details to match the selected car result
  So that pickup and drop-off information remains consistent

  @priority:high
  Scenario: Select a city result and compare pickup and drop-off locations between results and cart
    Given I am logged in as "brunajuliana@sabretlcfaketest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Wembley Stadium, Wembley, UK"
    # TODO: Map Testim step answer_ref_fields_chris_tree_and_proceed() to the repo's reference-fields workflow.
    When I select the first city center pickup location
    # TODO: Map the pickup location assertion from the selected result.
    # TODO: Map the drop-off location assertion from the selected result.
    When I add a car from city center results to cart
    Then the booking status should be "Pending booking"
    # TODO: Map cart assertions that pickup and drop-off locations match the captured result values.
