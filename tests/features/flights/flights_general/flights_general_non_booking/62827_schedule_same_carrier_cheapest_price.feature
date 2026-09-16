# Test Name: 62827 Amadeus - Flight - Search by schedule (same carrier) - "Cheapest package" is the same in pricing page and cart
# Status: Active
# Labels: Regression,Flights,by schedule,price,Amadeus,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-29T08:23:01Z
# Updated: 2025-09-01T03:07:34Z

@regression @flights @general @by-schedule @amadeus
Feature: 62827 Amadeus By Schedule - Same carrier cheapest package matches pricing and cart
  As a corporate traveler
  I want the cheapest package price to be consistent between pricing page and cart
  So that I can trust the price when booking

  Scenario: Cheapest package same carrier price matches in pricing page and cart
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "FRA" to "PRG"
    And I filter results by carrier "Lufthansa"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Lufthansa"
    And I select one flight segment by schedule
    # This will handle if the cheapest option appears as a ribbon-text in the "Your selection" card or in a new pricing option card
    And I wait for the cheapest option to be visible
    And I extract the price from the cheapest option
    And I add the cheapest option to trip
    Then the booking status should be "Pending booking"
    Then the cart total price should match the last extracted price
