# Test Name: 35097 Amadeus - Iberia branded fares are being displayed
# Status: Active
# Labels: Regression,Flights,Amadeus,Branded fares,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-28T11:22:43Z

@regression @amadeus @flights @branded_fares
Feature: 35097 Amadeus - Iberia branded fares are being displayed
  As a corporate traveler
  I want to search for Iberia flights
  So that I can see branded fare information including ancillaries

  Scenario: Iberia branded fares and ancillaries are displayed in cart
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I wait for add to trip text to be visible
    And I filter results by carrier "iberia"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    Then the carrier name in more details should be "Iberia"
    When I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
