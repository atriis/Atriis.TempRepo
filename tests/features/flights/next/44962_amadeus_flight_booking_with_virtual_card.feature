# Test Name: 44962 Amadeus - Flight - Booking with Virtual Card
# Status: Active
# Labels: Regression,FOP,Virtual Card,Full Purchase,Flights,Amadeus,Cancel by process,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-19T09:56:57Z

@regression @amadeus @flights @fop @virtual_card
Feature: 44962 Amadeus - Flight booking with virtual card
  As a corporate traveler
  I want to book a flight using a virtual card as payment method
  So that the booking is completed with the correct form of payment

  Scenario: Booking a one-way flight with virtual card FOP
    Given I am logged in as "brunalee" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "BKK"
    And I add the first flight to cart
    Then the payment type should be "Paid by TMC"
    When I proceed to checkout
    And I complete the booking
    # TODO: Original Testim verifies "Flight details" text is visible in trip overview
    # via waitForText(".more-details-btn", "Flight details") — no existing step covers this
