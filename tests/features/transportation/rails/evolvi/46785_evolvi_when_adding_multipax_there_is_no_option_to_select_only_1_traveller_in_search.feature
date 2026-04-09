# Test Name: 46785 Evolvi - When adding multipax, there is no option to select only 1 traveller in search
# Description:
# Status: Active
# Labels: multi pax,multi PTC,Regression,Daily Transportation,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-05T07:51:20Z
# Updated: 2026-02-03T05:36:16Z
@wip @transportation @rails @evolvi @regression
Feature: 46785 Evolvi - Multi traveler search should not show single traveler-only option
  As a corporate traveler
  I want to add multiple travelers in Evolvi search
  So that traveler selection options match multipax behavior

  Scenario: Multipax traveler selection validations in Evolvi search
    Given I am logged in as "corp_evolvi" booking a new trip
    # TODO: create step "When I select Evolvi in the search product selector" in evolvi_search.steps.js
    # covers: Selecting_Evolvi_option_in_search()
    When I select Evolvi in the search product selector
    And I have added myself as the traveler
    And I have added a random guest traveler
    # TODO: create step "And I add a third traveler named {string}" in search.steps.js
    # covers: add_third_traveller('Fabio Torres')
    And I add a third traveler named "Fabio Torres"
    # TODO: create step "Then the single traveler-only option should not be displayed in Evolvi search" in evolvi_search.steps.js
    # covers: Checking_that_one_traveler_is_not_displayed()
    Then the single traveler-only option should not be displayed in Evolvi search
