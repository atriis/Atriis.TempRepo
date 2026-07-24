# Test Name: 69752 Trips - 'Declined' trip is displayed when filtering by the status
# Description:
# Status: Active
# Labels: Regression,Trips,tripstatus,Filters,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-03T04:04:23Z
# Updated: 2025-11-03T04:47:14Z

@regression @shell @trips
Feature: 69752 - Trips declined trip is displayed when filtering by status
  As a corporate travel manager
  I want to filter trip monitor search results by the "Declined" status
  So that declined trips are shown in the results

  Scenario: A declined trip is displayed when filtering the search results by the declined status
    Given I am logged in as "karenramirez@approvalflowtripmonitor.com"
    Then the welcome heading should contain "Welcome Karen Ramirez"
    When I navigate to the trips page
    And I search the trips page for "3568167"
    Then the trips search should offer to expand the search
    When I expand the trips search
    Then the trips search results header should contain "Found 1 Trip"
    When I clear all trips filters
    Then the trips search should display no results
    When I open the trip status filter
    And I filter the search results by trip status "Declined"
    Then the trip status label "Declined" should be displayed
    And the trip with id "3568167" should be displayed in the results
