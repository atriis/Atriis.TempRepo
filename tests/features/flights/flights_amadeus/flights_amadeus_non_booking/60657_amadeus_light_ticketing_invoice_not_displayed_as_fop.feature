# Test Name: 60657 Amadeus Light Ticketing - Invoice is not displayed as FOP even if it is set in admin
# Status: Active
# Labels: Flights,Amadeus,FOP,Amadeus Light Ticketing,Low cost,Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-09T08:57:01Z

@regression @amadeus @flights @fop @light_ticketing
Feature: 60657 Amadeus Light Ticketing - Invoice is not displayed as FOP
  As a corporate traveler
  I want to book a low-cost flight
  So that the correct payment method is shown (credit card, not invoice)

  Scenario: Invoice is not displayed as FOP for light ticketing flights
    Given I am logged in as "lucas" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STN" to "MAD"
    And flight results should be available
    And I filter results by carrier "FR"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    Then the card "visa (not default)" should be visible
    Then 1 payment cards should be visible in the FOP panel
