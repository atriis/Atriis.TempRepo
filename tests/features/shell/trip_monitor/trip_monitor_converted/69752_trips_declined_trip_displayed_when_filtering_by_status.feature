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
    # TODO: Create step 'I search the trips page for {string}' — type the term into the trips search input (Testim: [placeholder='Location, trip or travellers'])
    And I search the trips page for "3568167"
    # TODO: Create step 'the trips search should offer to expand the search' — assert the "Click here to expand your search" option is shown in the suggestions dropdown
    Then the trips search should offer to expand the search
    # TODO: Create step 'I expand the trips search' — click the "expand your search" option to open the full search results (Testim: [aria-disabled='false'])
    When I expand the trips search
    # TODO: Create step 'the trips search results header should contain {string}' — assert the search-results header text contains the value (Testim: #pane-search-results is-flex-gap = "Found 1Trip")
    Then the trips search results header should contain "Found 1 Trip"
    # TODO: Create step 'I clear all trips filters' — click the clear-all filters control on the search results (Testim: .clear-all-btn)
    When I clear all trips filters
    # TODO: Create step 'the trips search should display no results' — assert the search-results no-results message is shown (Testim: #pane-search-results h3 = "No results found")
    Then the trips search should display no results
    # TODO: Create step 'I open the trip status filter' — open the trip status filter on the search results (Testim: .carriers-filter .material-symbols-outlined)
    When I open the trip status filter
    # TODO: Create step 'I filter the search results by trip status {string}' — tick the named status checkbox in the status filter (Testim: xpath label with p text = status)
    And I filter the search results by trip status "Declined"
    # TODO: Create step 'the trip status label {string} should be displayed' — assert the status label is displayed on the result (Testim: .app-label = "Declined")
    Then the trip status label "Declined" should be displayed
    # TODO: Create step 'the trip with id {string} should be displayed in the results' — assert a result trip shows the given trip id (Testim: .trip-id = "3568167")
    And the trip with id "3568167" should be displayed in the results
