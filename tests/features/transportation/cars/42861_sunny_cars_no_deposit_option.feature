# Test Name: 42861 Sunny Cars - "No Deposit" option is displayed for cars that have this option
# Description:
# Status: Active
# Labels: Cars,SunnyCars Regression,results,Regression,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-07-24T11:03:07Z
# Updated: 2026-02-03T01:50:41Z
@regression @cars @provider:sunnycars
Feature: 42861 Sunny Cars no deposit option is displayed in results
  As a corporate traveler
  I want to see when a Sunny Cars fare includes a no deposit option
  So that the results page reflects the supplier content correctly

  @priority:high
  Scenario: Search Sunny Cars and validate the no deposit option
    Given I am logged in as "kaylesun" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Barcelona Intl. (BCN),Barcelona, Spain"
    # TODO: Map Testim step answer_ref_fields_chris_tree_and_proceed() to the repo's reference-fields workflow.
    # TODO: Map Testim step Results____Add_to_trip__on_Request() to the correct on-request results wait/assertion.
    # TODO: Map Testim step __No_Deposit__option_is_displayed_for_cars_that_have_this_option() to a reusable car-results assertion.
