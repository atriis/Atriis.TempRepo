# Test Name: 59769 Flights - Multi City - Frosch TMC - Original currency is displayed across the system
# Status: Active
# Labels: Regression,Flights,currency,search,Cart,additional pricing options,results,multi city,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-24T04:06:02Z
# Updated: 2025-03-27T09:31:53Z

@regression @flights @general @currency @multi-city
Feature: 59769 Flights - Multi City Frosch TMC original currency displayed
  As a Frosch TMC corporate traveler
  I want to see original currency in multi-city flight results
  So that costs are displayed in my home currency

  # TODO: New user needed — tomblink182@froschtestimcorp.com → USER_TOMBLINK182 (same as 59765)

  Scenario: Original currency is displayed in multi-city results and pricing options
    Given I am logged in as "tomblink182" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search multi-city flights MIA→BOS, DFW→MIA" — 4 airport codes in multi-city
    # TODO: Step needed for "Verify USD currency in results"
    # TODO: Step needed for "Verify USD currency in pricing options"
    And I add the first flight to cart
    # TODO: Step needed for "Verify USD currency in cart"
