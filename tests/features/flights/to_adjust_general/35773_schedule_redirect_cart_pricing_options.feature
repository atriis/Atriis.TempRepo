# Test Name: 35773 Flight - Search by schedule redirects user to cart - from Additional Pricing Options
# Status: Active
# Labels: Lufthansa NDC Regression,Flights,by schedule,additional pricing options,GDS,67304,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-14T12:30:03Z
# Updated: 2026-01-06T01:55:24Z

@regression @flights @general @by-schedule @pricing-options
Feature: 35773 Flights - Search by schedule redirects to cart from pricing options
  As a corporate traveler
  I want to be redirected to the cart after selecting from pricing options in by-schedule search
  So that my booking flow is seamless

  # TODO: New user needed — henry@uni.com → USER_HENRY
  # Add to .env: USER_HENRY="henry@uni.com"

  Scenario: By-schedule pricing options redirect to cart
    Given I am logged in as "henry" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "SYD" to "TYO"
    And I select flight segments by schedule
    And I add to trip from pricing options
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    Then I successfully cancel the trip
