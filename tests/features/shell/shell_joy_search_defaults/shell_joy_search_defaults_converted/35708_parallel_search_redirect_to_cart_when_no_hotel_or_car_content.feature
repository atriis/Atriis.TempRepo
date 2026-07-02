# Test Name: 35708 Parallel search - When user group does not have content for hotel or car, after adding flight to cart system will redirect user to cart
# Description:
# Status: Active
# Labels: Regression,Flights,Parallel,No Amadeus Hotel Book,Search Flight,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-11T02:19:30Z
# Updated: 2024-04-14T12:15:45Z

@regression @shell @parallel-search @flights
Feature: 35708 Shell - Parallel search redirects to cart when no hotel or car content
  As a corporate traveler whose user group has no hotel or car content
  I want to be taken straight to the cart after adding a flight
  So that I can proceed with a flight-only trip

  Scenario: Adding a flight redirects to the cart when no parallel hotel or car content is available
    Given I am logged in as "bruna@testimparallel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "TLV"
    And I click proceed after search
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
