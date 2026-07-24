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
    # TODO: Create step 'I search the trips page for {string}' — type the term into the trips search input (Testim: #el-id-178-20)
    And I search the trips page for "Falcao Rappa"
    # TODO: Create step 'the trips search suggestions dropdown should be displayed' — assert the search suggestions popper is visible (Testim: .el-dropdown__popper [aria-disabled='true'])
    Then the trips search suggestions dropdown should be displayed
    # TODO: Create step 'the trips search should offer to expand the search' — assert the "Click here to expand your search" option is shown in the suggestions dropdown
    And the trips search should offer to expand the search
    # TODO: Create step 'I submit the trips search' — press Enter on the trips search input to run the search (Testim: sendSpecialCharacter Enter)
    When I submit the trips search
    # TODO: Create step 'a search results tab should be displayed' — assert the "Search results" tab is present (Testim: #tab-search-results)
    Then a search results tab should be displayed
    # TODO: Create step 'the search results should display a trip list' — assert the search-results pane renders trip cards (Testim: #pane-search-results .trip-list card-content visible)
    And the search results should display a trip list
    # TODO: Create step 'the search results should show a trip for traveller {string}' — assert a search-results trip lists the given traveller in its passengers (Testim: .passengers)
    And the search results should show a trip for traveller "Falcao Rappa"
    When I refresh the page
    # TODO: Create step 'the search results tab should no longer be displayed' — assert the "Search results" tab was removed after refresh
    Then the search results tab should no longer be displayed
    # TODO: Create step 'the {string} trips tab should be displayed' — assert the named default trips tab is shown (Testim: #tab-upcoming-trips / #tab-intravel-trips / #tab-past-trips)
    And the "Upcoming" trips tab should be displayed
    And the "Active" trips tab should be displayed
    And the "Past" trips tab should be displayed
    # TODO: Create step 'I check the {string} filter on the trips page' — tick the named filter checkbox in the trips filter panel (Testim: .app-filter__content :nth-child(3) el-checkbox)
    When I check the "My trips only" filter on the trips page
    And I search the trips page for "Amelia Eckhardt"
    And I submit the trips search
    # TODO: Create step 'the trips results count should be {string}' — assert the results count for the active pane equals the value (Testim: .has-text-weight-bold)
    Then the trips results count should be "0"
    # TODO: Create step 'I click the {string} trips tab' — click the named trips tab (Testim: #tab-past-trips p)
    When I click the "Past" trips tab
    # TODO: Create step 'the first past trip should display the {string} label' — assert the first past trip shows the given label (Testim: #pane-past-trips .consultant-wrapper span)
    Then the first past trip should display the "Consultant" label
    # TODO: Create step 'I uncheck the {string} filter on the trips page' — untick the named filter checkbox in the trips filter panel
    When I uncheck the "My trips only" filter on the trips page
    Then the trips results count should be "1"
    # TODO: Create step 'I search the past trips for {string}' — type the term into the past-trips search input (Testim: #el-id-3513-11)
    When I search the past trips for "Amelia Eckhardt"
    Then the trips results count should be "0"
