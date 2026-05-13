# Test Name: 47761 can see oop for number of passengers
# Status: Active
# Labels: Travel policy,Regression,OOP,Flights,No Amadeus Hotel Book,Full Purchase,multi pax,progress page,Cancel by process,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-07-02T05:34:00Z
# Updated: 2026-01-20T01:01:18Z

@regression @flights @general @oop @travel-policy @multi-pax
Feature: 47761 Flights - Can see OOP for number of passengers
  As a corporate traveler
  I want to see the out of policy indicator when enough passengers trigger the policy
  So that I am aware of policy violations

  Scenario: OOP indicator is visible for number of passengers
    Given I am logged in as "poly@cinam.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Amber Ofpas"
    And I search for a round trip flight from "LHR" to "MUC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the out of policy indicator should not be visible in cart
    And I accept Terms & Conditions
    And I hold the trip
    And I store the first booked flight number
    And I store the second booked flight number
    And I close tab 2
    When I book a new trip
    And I have added traveler by name "Poly Mispar"
    And I search for a round trip flight from "LHR" to "MUC"
    And I filter results by the stored flight number
    And I add the first result to trip
    And I validate the flight capacity restriction modal details
    And I validate flight capacity modal and go back
    Then the out of policy indicator should be visible in results
    Then the out of policy tooltip in results should be "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only"
    And I add the first result to trip
    And I validate flight capacity modal and click proceed anyway
    Then the booking status should be "Pending booking"
    Then the out of policy indicator should be visible in cart
    Then the out of policy tooltip in cart should be "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only"
    And I fill in the OOP justification text "bbbb"
    Then I successfully cancel the trip
