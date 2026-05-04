# Test Name: 35620 Sabre branded info in results, pricing and cart
# Status: Active
# Labels: No Amadeus Hotel Book,Branded fares,Flights,Regression,Sabre,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-31T09:51:03Z
# Updated: 2025-04-20T10:10:52Z

@regression @flights @sabre @branded-fares
Feature: 35620 Sabre - Branded fare info in results, pricing options and cart
  As a corporate traveler
  I want to see branded fare information in flight results, pricing options and cart
  So that I can understand what is included in each fare brand

  Scenario: Branded fare info is displayed in flight details, pricing options and cart
    Given I am logged in as "brunaovidio" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MIA" to "BOS"
    And flight results should be available
    When I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    When I click to open first pricing options
    And I open branded fares from pricing options
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close pricing options modal
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
