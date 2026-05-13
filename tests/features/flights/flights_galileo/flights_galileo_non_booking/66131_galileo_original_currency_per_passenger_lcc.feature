# Test Name: 66131 Galileo - Verify user original per passenger for multiple passengers, complete trip with LCC
# Description: The user currency serves as a reference to ensure that the price is displayed per passenger, matching the original currency price.
# Status: Active
# Labels: Regression,Galileo,results,price,Low cost,Flights,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-29T09:33:42Z
# Updated: 2025-10-06T06:57:15Z

@regression @galileo @flights @pricing @lcc @multi_pax
Feature: 66131 Galileo - Original currency per passenger with LCC complete trip

  As a corporate traveler
  I want the original currency price to be displayed per passenger for LCC flights
  So that pricing is transparent across multiple passengers

  Scenario: EasyJet original currency pricing per passenger and complete trip
    Given I am logged in as "galileoonly.gray@testimtest.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "BCN" to "LGW"
    And I filter airline results by "EasyJet" checkbox
    And flight results should be available
    Then the original currency symbol "€" should be visible in flight results
    When I store the first flight result display and original prices
    When I click to open first pricing options
    Then the original currency symbol "€" should be visible in pricing options
    And the first pricing option display and original prices should match the stored flight result prices
    And I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the original currency symbol "€" should be visible in cart
    And the cart display and original prices should match the stored flight result prices for all travelers