# Test Name: 20078 [Merge] GroundScope - Pick up time is pre-populated with time when flight was added, edit GroundScope works as expected and search button displayed in the cart when adding GroundScope from cart
# Description:
# Status: Active
# Labels: Groundscope Regression,search,edit,merge,Flights,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-05T01:02:14Z
# Updated: 2025-09-03T03:01:03Z

@regression @transportation @ground_transport @provider:groundscope @merge @flights
Feature: 20078 GroundScope - Pickup time is pre-populated and edit search works from cart

  As a corporate traveler
  I want GroundScope pickup time to be pre-populated from my booked flight and remain editable
  So that I can add the correct transfer from cart without losing search context

  Scenario: Flight pickup time is pre-populated for GroundScope and the edited search can still be added to cart
    Given I am logged in as "elisabeteferreira@groundscope.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LHR" to "MAD"
    And I handle conflicting quotes if visible
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I search for ground transport from cart validating prepopulated pickup time with "lhr" and airline "emirates"
    And I wait for add to trip text to be visible
    And I add the first result to trip
    When I search for ground transport from cart validating prepopulated pickup time with "lgw" and airline "lhr"
    And I edit the groundscope search from the results page
    And I wait for add to trip text to be visible
    And I add the first result to trip
    Then the groundscope result in cart should be correct
