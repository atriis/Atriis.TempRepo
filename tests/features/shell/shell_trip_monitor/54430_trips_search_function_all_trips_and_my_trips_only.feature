# Test Name: 54430 Trips - Search  function, all trips & 'my trips only'
# Description:
# Status: Active
# Labels: Trip monitor,Regression,Amsalem,2026 plan 1
# Owner: Noam Miller
# Created: 2024-11-20T05:34:01Z
# Updated: 2025-07-22T07:01:59Z

# Rewritten for the trips page rebuilt under AB#82671: the search suggestions and
# the Upcoming/Active/Past/Search-results tabs this test was written against no
# longer exist, so the search is now type-then-submit and the tabs are the filter
# rail's quick views. The ADO test case still describes the old screen.
#
# The closing block has no counterpart in the original, which ended by checking
# that a search FOR "Nicole Carolina" returned no "Ibire Cvvsky" — true whether or
# not the filter works. That assertion is kept for fidelity; this one can fail.

@regression @shell @trips
Feature: 54430 - Trips search function all trips and my trips only
  As a corporate travel manager
  I want to search the trip monitor and toggle the "My trips only" filter
  So that I can find trips for specific travellers and control whose trips are shown

  Scenario: Searching the trip monitor and filtering by my trips only
    Given I am logged in as "nicolecarolina@fusion.com"
    When I navigate to the trips page
    And I search the trips page for "Ibire Cvvsky"
    And I submit the trips search
    Then the search results should display a trip list
    And the search results should show a trip for traveller "Ibire Cvvsky"
    When I refresh the page
    Then the trips search input should be empty
    And the "To do" quick view should be displayed on the trips page
    And the "Upcoming trips" quick view should be displayed on the trips page
    And the "In travel trips" quick view should be displayed on the trips page
    And the "Past trips" quick view should be displayed on the trips page
    When I turn the "My trips only" filter switch on
    And I search the trips page for "Nicole Carolina"
    And I submit the trips search
    Then the search results should show a trip for traveller "Nicole Carolina"
    And the search results should not show a trip for traveller "Ibire Cvvsky"
    When I search the trips page for "Ibire Cvvsky"
    And I submit the trips search
    Then the trips search should display no results
