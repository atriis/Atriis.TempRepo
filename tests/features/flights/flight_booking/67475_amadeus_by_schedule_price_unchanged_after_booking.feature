# Test Name: 67475 Amadeus - Flights - By Schedule - Price does not change after booking
# Status: Active
# Labels: Regression,Flights,by schedule,Full Purchase,Amadeus,price,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-23T11:58:25Z

@regression @amadeus @flights @by_schedule @price
Feature: 67475 Amadeus - By schedule price does not change after booking
  As a corporate traveler
  I want to book a flight found by schedule search
  So that the price in the trip overview matches the price before booking

  Scenario: Price does not change after booking a by-schedule flight
    Given I am logged in as "ruimariano" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "MAN" to "PAR"
    And I select flight segments by schedule
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I extract the price at index 0 from "cart"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I extract the price at index 0 from "cart"
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
