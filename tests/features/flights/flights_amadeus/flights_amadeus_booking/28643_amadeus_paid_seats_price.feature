# Test Name: 28643 Amadeus select paid seats, validate price calculation and book flight
# Description:
# Status: Active
# Labels: Amadeus,Flights,Saets,Regression,No Amadeus Hotel Book,price,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-04-11T06:42:10Z
# Updated: 2026-01-19T07:28:58Z

@regression @flights @amadeus @seating @price
Feature: 28643 Amadeus - Paid seats price calculation and booking
  As a corporate traveler
  I want to select paid seats and verify the price calculation
  So that the total cost is correct after adding seat charges

  Scenario: Select paid seats, validate price, and book flight
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "AMS"
    And flight results should be available
    And I filter results by carrier "KL"
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I extract the price at index 3 from "cart"
    When I click to edit extras at index 4
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I extract seat price in seat map drawer
    And I save and close seat map drawer
    Then the total price in cart is equal to total price in cart before seats + seats price
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I click the extras arrow button
    Then the seat icon should be visible in trip overview
