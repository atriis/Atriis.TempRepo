# Test Name: 47762 don't see oop for number of passengers if there are not enough passengers with the exact dynamic field
# Status: Active
# Labels: Flights,results,Travel policy,OOP,multi pax,Regression,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-07-02T05:08:11Z
# Updated: 2026-02-17T08:36:54Z

@regression @flights @general @oop @travel-policy @multi-pax
Feature: 47762 Flights - No OOP for insufficient passengers with dynamic field
  As a corporate traveler
  I want to not see the out of policy indicator when not enough passengers trigger the policy
  So that false OOP alerts are avoided

  Scenario: OOP indicator is not visible when not enough passengers have the dynamic field
    Given I am logged in as "poly@cinam.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added traveler by name "lior nodyn"
    When I search for a round trip flight from "LON" to "MAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the out of policy indicator should not be visible in cart
    Then the out of policy free text justification should not be visible in cart