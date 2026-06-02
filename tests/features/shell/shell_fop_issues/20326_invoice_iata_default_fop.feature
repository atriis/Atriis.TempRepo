# Test Name: 20326 INVOICE is displayed as default FOP when IATA payment option is configured as default
# Description:
# Status: Active
# Labels: Regression,Invoice,FOP,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-11T04:36:56Z
# Updated: 2025-11-20T07:57:42Z

@regression @flights @fop @invoice @iata
Feature: 20326 Amadeus - INVOICE is displayed as default FOP when IATA payment option is configured as default
  As a corporate traveler whose company has an IATA invoice FOP set as default
  I want to see "Paid by TMC" and the IATA invoice card pre-selected
  So that I know the correct default FOP is applied automatically

  @priority:high
  Scenario: Default IATA invoice FOP is shown as Paid by TMC and pre-selected in the cart
    Given I am logged in as "dor@down.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    And I click proceed button if visible
    And I filter results by carrier "IB"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the payment type should be "Paid by TMC"
    When I click to edit the card
    Then the card "TESTIM IATA amadeus flight" should be visible
    And the card "TESTIM IATA amadeus flight" checkbox should be checked
