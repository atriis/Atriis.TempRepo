# Test Name: 62109 - Search by schedule - Filters in results page updated according to displayed leg
# Status: Active
# Labels: by schedule,Amadeus,multi city,Filters,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-15T08:54:12Z
# Updated: 2025-11-25T02:03:15Z

@regression @flights @general @by-schedule @filters
Feature: 62109 Flights - Search by schedule filters updated per displayed leg
  As a corporate traveler
  I want filters to update according to the currently displayed leg
  So that I can filter flights appropriately for each segment

  # TODO: New user needed — filter@test.com → USER_FILTER
  # Add to .env: USER_FILTER="filter@test.com"

  Scenario: Filters update per leg in by-schedule search and multi-city
    Given I am logged in as "filter@amadeus.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search flights by schedule"
    # TODO: Step needed for "Validate filters are updated according to displayed leg"
    # TODO: Step needed for "Back to search page"
    # TODO: Step needed for "Search multi-city by schedule"
    # TODO: Step needed for "Validate filters are updated for multi-city legs"
