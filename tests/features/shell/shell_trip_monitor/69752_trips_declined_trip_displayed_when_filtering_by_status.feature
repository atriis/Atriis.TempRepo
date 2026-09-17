# Test Name: 69752 Trips - 'Declined' trip is displayed when filtering by the status
# Description:
# Status: Active
# Labels: Regression,Trips,tripstatus,Filters,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-03T04:04:23Z
# Updated: 2025-11-03T04:47:14Z

# Rewritten for the trips page rebuilt under AB#82671, same treatment as 54430:
# the search suggestions dropdown and its "Click here to expand your search" row
# are gone, so the search is now type-then-submit. The results header wording
# changed with the rebuild too ("Found N trip(s)" -> the list panel's "Showing N
# trips"). The ADO test case still describes the old screen.
#
# The trip id asserted at the end is the searched trip itself (3868891). The
# original expected 3568167, a trip that is no longer relevant to this scenario.

@regression @shell @trips
Feature: 69752 - Trips declined trip is displayed when filtering by status
  As a corporate travel manager
  I want to filter trip monitor search results by the "Declined" status
  So that declined trips are shown in the results

  Scenario: A declined trip is displayed when filtering the search results by the declined status
    Given I am logged in as "karenramirez@approvalflowtripmonitor.com"
    Then the welcome heading should contain "Welcome Karen Ramirez"
    When I navigate to the trips page
    And I search the trips page for "3868891"
    And I submit the trips search
    Then the trips search results header should contain "Showing 1 trip"
    When I clear all trips filters
    Then the trips search should display no results
    When I open the trip status filter
    And I filter the search results by trip status "Declined"
    Then the trip status label "Declined" should be displayed
    And the trip with id "3868891" should be displayed in the results
