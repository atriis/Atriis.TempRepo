# Test Name: 59765 Flights - Complete Search - Frosch TMC - Original currency is displayed across the system
# Status: Active
# Labels: Regression,Flights,currency,search,Complete trip,Cart,additional pricing options,price offer,results,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-24T12:25:25Z
# Updated: 2025-08-20T01:19:21Z

@regression @flights @general @currency
Feature: 59765 Flights - Frosch TMC original currency displayed across the system
  As a Frosch TMC corporate traveler
  I want to see the original currency (USD) displayed consistently
  So that I can accurately track costs in my home currency

  Scenario: Original currency is displayed in results, pricing options, share quote, and cart
    Given I am logged in as "tomblink182@froschtestimcorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MIA" to "BOS"
    And flight results should be available
    Then the original currency symbol "$" should be visible in flight results
    Then the original currency symbol "$" should be visible in the share quote from results
    When I click to open first pricing options
    Then the original currency symbol "$" should be visible in pricing options
    When I close pricing options modal
    When I click edit search and wait for the "Complete trip" search mode option
    And I search for a one way flight from "MIA" to "BOS"
    And flight results should be available
    Then the original currency symbol "$" should be visible in flight results
    Then the original currency symbol "$" should be visible in the share quote from results
    And I exit share mode
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the original currency symbol "$" should be visible in cart
