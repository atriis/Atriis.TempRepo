# Test Name: 42860 Joy search defaults on TMC level are being applied for corporate
# Description:
# Status: Active
# Labels: Regression,Administration,search,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-27T11:09:24Z
# Updated: 2024-02-27T01:47:20Z

@regression @shell @parallel-search @administration
Feature: 42860 Shell - Joy search defaults on TMC level are applied for corporate
  As a corporate traveler under a TMC with joy search defaults configured
  I want the parallel search defaults to be applied on the flight search
  So that the "Add Hotel to this trip" option and parallel search checkbox are pre-set

  Scenario: TMC-level joy search defaults are applied on a new trip search
    Given I am logged in as "bruna@testimnongdstmc.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step to verify the "Add Hotel to this trip" parallel option is visible on the flight tab (create ParallelSearch.verifyAddHotelOptionVisible in src/dsl/ParallelSearch.js)
    Then the "Add Hotel to this trip" parallel option should be visible on the flight tab
    # TODO: Create step to verify the parallel search checkbox is checked by default (create ParallelSearch.verifyParallelSearchCheckboxChecked in src/dsl/ParallelSearch.js)
    And the parallel search checkbox should be checked by default
