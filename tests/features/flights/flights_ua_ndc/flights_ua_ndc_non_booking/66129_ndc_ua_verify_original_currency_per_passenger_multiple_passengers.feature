# Test Name: 66129 NDC UA - Verify user original per passenger for multiple passengers, complete trip
# Description: The user currency serves as a reference to ensure that the price is displayed per passenger, matching the original currency price.
# Status: Active
# Labels: Regression,results,price,UA ndc,Flights,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-29T12:17:35Z
# Updated: 2025-10-07T07:08:10Z

@regression @flights @ndc @united @price @original-currency
Feature: 66129 NDC UA - Verify original currency per passenger for multiple passengers

  As a corporate traveler
  I want to see the original currency price displayed per passenger
  So that I can verify the price breakdown matches the original currency

  Scenario: Verify original currency is displayed per traveler in results, pricing options, and cart
    Given I am logged in as "uandc.amsalem@testimcorporate.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "ORD" to "LAX"
    And flight results should be available
    Then the original currency symbol "$" should be visible in flight results
    When I store the first flight result display and original prices
    When I click to open first pricing options
    Then the original currency symbol "$" should be visible in pricing options
    And the first pricing option display and original prices should match the stored flight result prices
    And I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the original currency symbol "$" should be visible in cart
    And the cart display and original prices should match the stored flight result prices for all travelers