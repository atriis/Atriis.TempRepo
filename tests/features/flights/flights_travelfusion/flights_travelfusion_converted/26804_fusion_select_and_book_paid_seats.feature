# Test Name: 26804 Fusion - Select and book paid seats, seat price added correctly in cart
# Status: Active
# Labels: Regression,Fusion,Seating,No Amadeus Hotel Book,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-30T07:51:32Z
# Updated: 2025-10-01T07:56:22Z

@regression @flights @fusion @seating @full-purchase @priority:high
Feature: 26804 Fusion - Select and book paid seats with correct price in cart
  As a corporate traveler booking a Fusion low-cost flight with paid seat selection
  I want the seat price to be added correctly to the cart total
  So that the total price reflects both flight and seat costs

  Scenario: Select and book paid seats on Fusion flight and verify seat cost in total
    Given I am logged in as "testim@fusion.com" booking a new trip
    And I have added myself as the traveler
    # TODO: implement 'I search for a default Fusion flight' — see Search_flights() (no params) in Testim source (test 26804); confirm exact route and search mode
    When I search for a one way flight from "LGW" to "MXP"
    And I filter results by carrier "U2"
    And I add the first flight to cart
    # TODO: implement 'the seat cost plus the flight cost should equal the total cart cost' — see Validate_seat_cost___flight_cost_equal_total_cost() in Testim source (test 26804)
    When I complete the booking
