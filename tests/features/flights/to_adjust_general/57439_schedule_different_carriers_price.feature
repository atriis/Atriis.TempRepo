# Test Name: 57439 Amadeus - Flight - Search by schedule (different carriers) - "My Selection" has the correct price in pricing page and cart
# Status: Active
# Labels: Regression,Flights,by schedule,price,Amadeus,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-30T08:16:30Z
# Updated: 2025-08-26T08:27:37Z

@regression @flights @general @by-schedule @amadeus
Feature: 57439 Amadeus By Schedule - Different carriers My Selection correct price
  As a corporate traveler using by-schedule search with different carriers
  I want My Selection price to be correct from search to cart
  So that mixed-carrier pricing is accurately displayed

  Scenario: My Selection price matches from pricing page to cart with different carriers
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "DUB" to "PAR"
    # TODO: Step needed for "Select first segment flight"
    # TODO: Step needed for "Select second segment flight (different carrier)"
    # TODO: Step needed for "Add My Selection to cart"
    # TODO: Step needed for "Verify price in cart matches pricing page"
