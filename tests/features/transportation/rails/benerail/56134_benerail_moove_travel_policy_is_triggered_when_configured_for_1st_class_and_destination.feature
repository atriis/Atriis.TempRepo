# Test Name: 56134 Benerail Moove - Travel Policy is triggered when configured for 1st class and destination
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Travel policy,Rail,OOP,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-31T01:49:08Z
# Updated: 2025-09-01T06:16:36Z
@wip @transportation @rails @benerail @regression @travel_policy
Feature: 56134 Benerail - Travel policy triggered when configured for 1st class and destination
  As a corporate traveler subject to a travel policy for 1st class and destination rules
  I want to see the out-of-policy indicator when selecting a 1st class or disallowed destination
  So that the travel policy is enforced correctly for Benerail bookings

  Scenario: OOP indicator appears when booking a Benerail route with 1st class and destination policy
    Given I am logged in as "justinbieber@benerail.com" booking a new trip
    And I have added myself as the traveler
    # TODO: note Search_benerail_by_place_one_way__direct_only_ uses direct-only filter
    # The existing step does not support direct-only — add TODO on BenerailSearch DSL to add directOnly option
    When I search for a one way Benerail train from "beleuToBeabc"
    And I click proceed on the reference fields popup
    # TODO: create step "Then the travel policy should be triggered for 1st class and destination in Benerail" in benerail_results.steps.js
    # covers: Travel_Policy_is_triggered_when_configured_for_1st_class_and_destination()
    # — validates OOP indicator appears in results for 1st class and destination-restricted route
    Then the travel policy should be triggered for 1st class and destination in Benerail
