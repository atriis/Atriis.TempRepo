# Test Name: 61638 Trip Monitor - In case full name with more than 20 characters, first letter of last name and tooltip with full name are displayed
# Description:
# Status: Active
# Labels: Trip monitor,Regression,name,full name,guest,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-06T08:38:51Z
# Updated: 2025-07-08T09:13:57Z

@regression @shell @trips
Feature: 61638 - Trip monitor long name shows last name initial and tooltip
  As a corporate travel manager
  I want traveller names longer than 20 characters truncated to the first name and last-name initial
  So that the trip list stays readable and the full name is available in a tooltip

  Scenario: Long traveller name is truncated with a full-name tooltip on the trip
    Given I am logged in as "ruimariano@amadeus.com"
    When I navigate to the trips page
    # TODO: Create step 'I check the {string} filter on the trips page' — tick the named filter checkbox in the trips filter panel (Testim: 8th checkbox in .el-checkbox-group; confirm the label maps to "Guest")
    And I check the "Guest" filter on the trips page
    # TODO: Create step 'I search the trips page for {string}' — type the term into the trips search input (Testim: #el-id-9465-212)
    And I search the trips page for "3487972"
    # TODO: Create step 'the trips search should offer to expand the search' — assert the "Click here to expand your search" option is shown in the suggestions dropdown
    Then the trips search should offer to expand the search
    # TODO: Create step 'I expand the trips search' — click the "expand your search" option to open the full search results (Testim: [class^='ml'])
    When I expand the trips search
    Then the trip title should contain "Trip 3487972"
    # TODO: Create step 'the traveller name should be displayed as {string} with tooltip {string}' — assert the truncated name text equals the first value and its title tooltip equals the full name (Testim: [title='Bruna Don Diego De La Vega'] shows "Bruna V")
    And the traveller name should be displayed as "Bruna V" with tooltip "Bruna Don Diego De La Vega"
