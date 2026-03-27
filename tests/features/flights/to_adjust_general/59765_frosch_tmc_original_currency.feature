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

  # TODO: New user needed — tomblink182@froschtestimcorp.com → USER_TOMBLINK182
  # Add to .env: USER_TOMBLINK182="tomblink182@froschtestimcorp.com"

  Scenario: Original currency is displayed in results, pricing options, share quote, and cart
    Given I am logged in as "tomblink182" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MIA" to "BOS"
    And flight results should be available
    # TODO: Step needed for "Verify USD currency symbol is displayed in results"
    # TODO: Step needed for "Verify USD currency in share quote from results"
    # TODO: Step needed for "Verify USD currency in pricing options"
    # TODO: Step needed for "Verify USD currency in one-way search results and share quote"
    And I add the first flight to cart
    # TODO: Step needed for "Verify USD currency in cart"
