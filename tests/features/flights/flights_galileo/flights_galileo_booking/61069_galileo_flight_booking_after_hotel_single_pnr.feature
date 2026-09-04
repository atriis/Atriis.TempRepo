# Test Name: 61069 Galileo - Flight booking successful when added after a hotel/car is already booked (single pnr permission)
# Status: Active
# Labels: Galileo,Gray Dawes,Flights,Hotel,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-17T07:31:12Z
# Updated: 2025-09-14T10:46:00Z

@regression @galileo @flights @hotel @single_pnr
Feature: 61069 Galileo - Flight booking after hotel booked with single PNR

  As a corporate traveler
  I want to book a flight after a hotel is already booked
  So that both products share a single PNR

  Scenario: Flight added after hotel booking creates single PNR
    Given I am logged in as "carCorp@gdg.com" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "SIN" to "ZRH" with the same dates as the hotel search
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should match
    And I attempt to cancel the trip safely
