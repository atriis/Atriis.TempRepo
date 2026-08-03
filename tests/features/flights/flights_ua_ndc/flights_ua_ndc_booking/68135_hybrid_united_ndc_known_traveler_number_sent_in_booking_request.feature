# Test Name: HYBRID for 68135 United NDC - Known Traveler Number is being sent in the booking request
# Description:
# Status: Active
# Labels: United,UA,Flights,UA ndc,Regression,Full Purchase,hybrid,known traveler,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-26T05:22:15Z
# Updated: 2025-10-01T04:09:57Z

@regression @flights @ndc @united @hybrid @known-traveler @full-purchase
Feature: 68135 HYBRID United NDC - Known Traveler Number is being sent in the booking request

  As a corporate traveler with a known traveler number
  I want to complete a booking with a traveler that has a known traveler number
  So that the number is sent in the booking request to the airline

  Scenario: Complete booking with known traveler number and cancel trip
    Given I am logged in as "bsua@bsua.com" booking a new trip
    And I have added traveler by name "Cristiano Ronaldo"
    When I search for a one way flight from "IAH" to "EWR"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I successfully cancel the trip
