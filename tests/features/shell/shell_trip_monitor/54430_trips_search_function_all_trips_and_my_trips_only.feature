# Test Name: 54430 Trips - Search  function, all trips & 'my trips only'
# Description:
# Status: Active
# Labels: Trip monitor,Regression,Amsalem,2026 plan 1
# Owner: Noam Miller
# Created: 2024-11-20T05:34:01Z
# Updated: 2025-07-22T07:01:59Z

@regression @shell @trips
Feature: 54430 - Trips search function all trips and my trips only
  As a corporate travel manager
  I want to search the trip monitor and toggle the "My trips only" filter
  So that I can find trips for specific travellers and control whose trips are shown

  Scenario: Searching the trip monitor and filtering by my trips only
    Given I am logged in as "nicolecarolina@fusion.com"
    When I navigate to the trips page
    And I search the trips page for "Ibire Cvvsky"
    Then the trips search suggestions dropdown should be displayed
    And the trips search should offer to expand the search
    When I submit the trips search
    Then a search results tab should be displayed
    And the search results should display a trip list
    And the search results should show a trip for traveller "Ibire Cvvsky"
    When I refresh the page
    Then the search results tab should no longer be displayed
    And the "Upcoming" trips tab should be displayed
    And the "Active" trips tab should be displayed
    And the "Past" trips tab should be displayed
    When I check the "My trips only" filter on the trips page
    And I search the trips page for "Nicole Carolina"
    And I submit the trips search
    Then a search results tab should be displayed
    And the search results should show a trip for traveller "Nicole Carolina"
    And the search results should not show a trip for traveller "Ibire Cvvsky"
