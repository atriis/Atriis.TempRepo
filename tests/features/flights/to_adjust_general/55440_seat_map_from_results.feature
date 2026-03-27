# Test Name: 55440 Seat map from results
# Description: Access seat map from search result and Show loading messages in searches
# Status: Active
# Labels: Flights,Seating,results,Regression,2026 plan 1
# Owner: pini harush
# Created: 2024-12-09T06:17:34Z
# Updated: 2025-01-07T08:15:22Z

@regression @flights @general @seating
Feature: 55440 Flights - Seat map from results
  As a corporate traveler
  I want to access the seat map from flight search results
  So that I can preview seat availability before adding to cart

  # TODO: New user needed — anthonydubu@amadeus.com → USER_ANTHONYDUBU
  # Add to .env: USER_ANTHONYDUBU="anthonydubu@amadeus.com"

  Scenario: Seat map is accessible from search results
    Given I am logged in as "anthonydubu" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "NYC"
    # TODO: Step needed for "Open seat map from results and verify it loads"
    # TODO: Step needed for "Verify loading messages are displayed during search"
