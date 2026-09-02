# Test Name: 28639 Amadeus - Book with FOP AirPlus
# Status: Active
# Labels: Regression,Amadeus,FOP,Adding Passengers,Full Purchase,progress page,Cancel by process,2026 plan 1
# Owner: Noam Miller
# Created: 2023-09-04T05:23:16Z

@regression @amadeus @flights @fop @airplus
Feature: 28639 Amadeus - Book flight with FOP AirPlus
  As a corporate traveler
  I want to book a flight using AirPlus payment method
  So that the booking completes with the correct form of payment

  Scenario: Booking flight with AirPlus FOP
    Given I am logged in as "olgac@club.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "SIN" to "ZRH"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
