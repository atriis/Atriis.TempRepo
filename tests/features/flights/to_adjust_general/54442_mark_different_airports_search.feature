# Test Name: 54442 Mark different airports in search
# Status: Active
# Labels: Regression,Flights,results,Amadeus,multi city,2026 plan 1
# Owner: pini harush
# Created: 2024-11-26T02:13:54Z
# Updated: 2025-09-16T09:06:18Z

@regression @flights @general @multi-city
Feature: 54442 Flights - Mark different airports in search
  As a corporate traveler
  I want different airports to be marked in multi-city search
  So that I can identify airport changes between segments

  # TODO: New user needed — joana@amadeusandafklm.com → USER_JOANA (if not already added)

  Scenario: Different airports are marked in multi-city search results
    Given I am logged in as "joana" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search multi-city with 2 legs: LHR→MXP, LIN→LCY"
    # TODO: Step needed for "Verify different airports are visually marked/highlighted in results"
