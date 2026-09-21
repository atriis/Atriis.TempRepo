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

  Scenario: Original currency is displayed in multi-city results and pricing options
    Given I am logged in as "tomblink182@froschtestimcorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "MIA-BOS, DFW-MIA"
    And flight results should be available
    Then the original currency symbol "$" should be visible in flight results
    When I click to open first pricing options
    Then the original currency symbol "$" should be visible in pricing options
    When I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the original currency symbol "$" should be visible in cart
