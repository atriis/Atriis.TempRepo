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
    When I search for a one way flight from "LGW" to "MXP"
    And I filter results by carrier "U2"
    And I extract the price from first flight result
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    And I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I extract seat price in seat map drawer
    And I save and close seat map drawer
    And the booking status should be "Pending booking"
    Then the total price in cart is equal to total price in cart before seats + seats price
    And I fill credit card cvv if needed
    And I proceed to checkout
    When I complete the booking with Fusion credit card verification
    Then the quote destination should contain "Flight to"
