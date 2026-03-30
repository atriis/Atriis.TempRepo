# Test Name: 46256 Amadeus - Split ticket - When split rules, the system splits the carriers into two quotes
# Status: Active
# Labels: Regression,Amadeus,split ticket,split rules,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-26T06:17:47Z

@regression @amadeus @flights @split_rules @split_ticket
Feature: 46256 Amadeus - Split ticket carriers into two quotes
  As a corporate traveler
  I want to add a flight with split rules enabled
  So that the system correctly splits the carriers into separate quotes

  Scenario: Flight with split rules produces two separate quotes in cart
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LAS" to "LAX"
    And I wait for add to trip text to be visible
    And I filter airline results by "Multi carrier" checkbox
    Then the "Separated Tickets" indicator should be visible in results
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the first quote destination should contain "Los Angeles"
    And the last quote destination should contain "Las Vegas"
