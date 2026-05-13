# Test Name: 62215 Benerail Moove> Train details on Journey Details
# Description: Train details on Journey Details
# Status: Active
# Labels: Rail,Benerail Moove Regression,Adding Passengers,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-20T11:41:52Z
# Updated: 2025-12-23T04:43:06Z
@wip @transportation @rails @benerail @regression
Feature: 62215 Benerail - Train details are shown on Journey Details panel
  As a corporate traveler
  I want to see the train details (operator, type, number) in the Journey Details panel
  So that I can confirm the correct train is displayed before booking

  Scenario: Train details are visible in Benerail journey details panel
    Given I am logged in as "beny@benerail.com" booking a new trip
    And I have added myself as the traveler
    # TODO: note Search_benerail_by_place_one_way__direct_only_ uses direct-only filter
    # The existing step does not support direct-only — add TODO on BenerailSearch DSL to add directOnly option
    When I search for a one way Benerail train from "nlabkToNlasc"
    And I click proceed on the reference fields popup
    When I select the first Benerail option
    # TODO: create step "Then the train details should be displayed in the Benerail journey details" in benerail_results.steps.js
    # covers: Train_details_on_Journey_Details_are_shown() — opens journey details and validates train info
    Then the train details should be displayed in the Benerail journey details
