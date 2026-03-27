# Test Name: 61591 Passenger Info - No default gender when no title, selection mandatory
# Status: Active
# Labels: Gray Dawes,APIS,Flights,Daily Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-04T01:56:33Z
# Updated: 2026-02-16T02:32:19Z

@regression @flights @general @apis
Feature: 61591 Flights - No default gender when no title selection mandatory
  As the system
  I want gender to not be pre-selected when no title is set
  So that travelers must explicitly select their gender

  # TODO: New user needed — defaultTitle@gdg.com → USER_DEFAULTTITLE
  # Add to .env: USER_DEFAULTTITLE="defaultTitle@gdg.com"

  Scenario: No default gender is set and user can add and save passenger info
    Given I am logged in as "defaulttitle" booking a new trip
    # TODO: Step needed for "Add traveler by name (specific traveler)"
    # TODO: Step needed for "Search flight and add to cart"
    # TODO: Step needed for "Verify no default gender is set in passenger info"
    # TODO: Step needed for "Add gender and save passenger info successfully"
    Then I successfully cancel the trip
