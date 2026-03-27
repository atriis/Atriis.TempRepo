# Test Name: 46669 Reset stop filter when no results found according to search criteria
# Status: Active
# Labels: NL government,search,Filters,Regression,2026 plan 1
# Owner: Noam Miller
# Created: 2024-05-29T07:50:16Z
# Updated: 2025-11-25T11:31:22Z

@regression @flights @general @filters
Feature: 46669 Flights - Reset stop filter when no results found
  As a corporate traveler
  I want the stop filter to be reset when no results are found
  So that I still see available flights

  # TODO: New user needed — resetFilter@nl.gov → USER_RESETFILTER
  # Add to .env: USER_RESETFILTER="resetFilter@nl.gov"

  Scenario: Stop filter is reset when no results found according to search criteria
    Given I am logged in as "resetfilter" booking a new trip
    # TODO: Step needed for "Search flights from BOI to LEJ round trip"
    # TODO: Step needed for "Verify alert 'No results found according to your search criteria, search parameters have been reset' is displayed"
    # TODO: Step needed for "Verify results are displayed after filter reset"
    # TODO: Step needed for "Edit search with 'Direct only' stops filter and verify reset again"
