# Test Name: 72982: Amadeus - Can book for multi pax with GDS profile*
# Description:
# Status: Active
# Labels: BTA First Travel,Amadeus,Profile,Flights,hold flight,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2026-01-25T09:51:35Z
# Updated: 2026-01-25T01:36:14Z

@regression @flights @amadeus @hold @multi-pax @profile
Feature: 72982 Amadeus - Can book for multi pax with GDS profile
  As a corporate traveler
  I want to book a flight for multiple passengers using a GDS profile
  So that I can hold a trip for myself and a guest

  Scenario: Book and hold a round trip flight for 2 passengers with GDS profile
    Given I am logged in as "amadeus_gds" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "ZRH" to "LIS"
    And I wait for add to trip text to be visible
    And I add the first flight to cart
    And I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
