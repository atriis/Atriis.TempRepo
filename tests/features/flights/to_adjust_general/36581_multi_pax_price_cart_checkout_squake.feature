# Test Name: 36581 Flight - Price for multi pax is displayed correctly in the cart and checkout + Squake tooltip
# Status: Active
# Labels: multi pax,Flights,Regression,CO2,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-28T12:11:55Z
# Updated: 2026-01-26T03:26:28Z

@regression @flights @general @multi-pax @co2
Feature: 36581 Flights - Multi pax price displayed correctly in cart and checkout with Squake tooltip
  As a corporate traveler booking for multiple passengers
  I want to see the correct total price in the cart and checkout
  So that I can verify the cost before booking

  # TODO: New user needed — sebastian@one.com → USER_SEBASTIAN
  # Add to .env: USER_SEBASTIAN="sebastian@one.com"

  Scenario: Multi pax flight price is correct in cart and checkout with CO2 tooltip
    Given I am logged in as "sebastian" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "josh"
    And I have added traveler by name "bene"
    When I search for a one way flight from "LIS" to "NYC"
    # TODO: Step needed for "Close mandatory notification popup"
    # TODO: Step needed for "Verify CO2 Squake tooltip in results"
    And I add the first result to trip
    # TODO: Step needed for "Verify CO2 Squake tooltip in cart"
    And I click to open price breakdown in cart
    # TODO: Step needed for "Verify prices in price breakdown for multi pax"
    When I close price breakdown modal
    And I add a credit card as payment method
    And I proceed to checkout
    # TODO: Step needed for "Handle price change prompt if visible"
    # TODO: Step needed for "Verify price in checkout matches cart"
    When I navigate to cart from checkout
    Then I successfully cancel the trip
