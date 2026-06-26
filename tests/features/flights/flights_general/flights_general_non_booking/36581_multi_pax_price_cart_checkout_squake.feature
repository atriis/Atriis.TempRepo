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

  Scenario: Multi pax flight price is correct in cart and checkout with CO2 tooltip
    Given I am logged in as "sebastian@one.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "josh"
    And I have added traveler by name "bene levi"
    When I search for a one way flight from "LIS" to "NYC"
    And flight results should be available
    Then the CO2 Squake tooltip should be visible in flight results
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    And I save the current flight cart total for checkout comparison
    Then the CO2 Squake tooltip should be visible in cart
    And I click to open price breakdown in cart
    Then the flight price breakdown should match the totals for 3 travelers
    When I close price breakdown modal
    And I add a credit card as payment method
    And I proceed to checkout
    And I wait for booking details in checkout
    Then the checkout total price should match the saved flight cart total
    When I navigate to cart from checkout
    And I validate price change if displayed and proceed
    Then the booking status should be "On hold"
    Then I successfully cancel the trip