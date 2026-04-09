# Test Name: 63183 BenerailMoove> Validate improvements on autocomplete
# Description: Validate improvements on autocomplete
# Status: Active
# Labels: Regression,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-06-06T03:32:48Z
# Updated: 2025-12-23T04:49:29Z
@wip @transportation @rails @benerail @regression
Feature: 63183 Benerail - Autocomplete improvements validation
  As a corporate traveler using the Benerail search form
  I want the station autocomplete to show improved suggestions and behavior
  So that finding stations is faster and more intuitive

  Scenario: Benerail autocomplete improvements are working correctly
    Given I am logged in as "testim_bene" booking a new trip
    # NOTE: This test clicks the nested rail tab directly (no traveler added before search)
    # TODO: create step "When I navigate to the Benerail rail search tab" in benerail_search.steps.js or app.steps.js
    # covers: page.click(".nested-tabs-select span") + page.click("#el-id-2070-26 > span") to switch to rail sub-tab
    When I navigate to the Benerail rail search tab
    # TODO: create step "Then the Benerail autocomplete improvements should be validated" in benerail_search.steps.js
    # covers: Validating_improvements_on_autocomplete() — tests autocomplete filtering, keyboard nav, result count
    Then the Benerail autocomplete improvements should be validated
