# Test Name: 47764 can see travel policy for number of passengers
# Description:
# Status: Active
# Labels: multi pax,Flights,Regression,Travel policy,OOP,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-08T09:24:04Z
# Updated: 2025-04-08T09:46:54Z

@regression @travel_policy @oop @flights @multi_pax @shell
Feature: 47764 Travel Policy - OOP for number of passengers

  As a corporate traveler
  I want the system to enforce travel policy on number of passengers per flight
  So that flight capacity restrictions are triggered correctly

  Scenario: Flight capacity restriction and OOP triggered for 3 passengers
    Given I am logged in as "Poly@Cinam.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "poly mispar"
    And I add a third traveler named "amber ofpas"
    When I search for a round trip flight from "MAD" to "PAR"
    And I add to cart and proceed past flight capacity modal
    # TODO: Validate OOP badge and tooltip in pricing popup - "Number of Passengers is greater than or equals 3 and role - dont change is for number of passengers only"
    # TODO: Validate second capacity restriction popup after proceeding with "Go back" button
    # TODO: Click "Proceed anyway" on the final popup
    Then the out of policy indicator should be visible in cart
    And the out of policy tooltip in cart should be "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only"
