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
    Given I am logged in as "ruimariano" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "AMS"
    And I wait for add to trip text to be visible
    And I filter results by carrier "KL"
    And I click to open first pricing options
    # TODO: Select first pricing option and add to trip
    # Testim: clicks first option ".flicking-camera > :nth-child(1) .btn--primary"
    # then clicks ".add-btn"
    And I add to trip from pricing options
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I extract the price at index 0 from "cart"
    # TODO: Open seating panel and add seats
    # Testim: scrolls to seating → clicks seating panel → clicks "Add Seats" →
    # selects available seat → extracts seat cost → saves
    And I select the first available flight seat
    When I extract the price at index 1 from "cart"
    # TODO: Validate flight cost + seat cost = total cost
    # Testim: validate_number1_number2_number3(flightCost, seatCost, totalCost)
    # Need custom validation: extracted price 0 + seat cost = extracted price 1
    And I proceed to checkout
    And I complete the booking
    # TODO: Verify seat icon is visible in trip overview after booking
    # Testim: scrolls to seating → checks ".yellow" (seat status icon) visible
