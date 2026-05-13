# Test Name: 56162 Benerail Moove - Extras - Mandatory "Age Association" field is not displayed
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,Extras,Cart,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-02T07:13:34Z
# Updated: 2025-05-12T11:54:29Z
@wip @transportation @rails @benerail @regression
Feature: 56162 Benerail - Mandatory Age Association field is not displayed in extras for guest traveler
  As a corporate traveler booking for a guest
  I want the mandatory Age Association field to NOT appear in the Benerail extras for a guest passenger
  So that the extras section remains clean and uncluttered

  Scenario: Age association mandatory field is not shown in Benerail extras for guest traveler
    Given I am logged in as "beny@benerail.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    # TODO: create step "And I fill in the reference fields for the guest traveler" in benerail_search.steps.js
    # covers: Ref_field_guest() — fills reference fields specific to a guest traveler
    And I fill in the reference fields for the guest traveler
    And I click proceed on the reference fields popup
    When I add a Benerail round trip to the trip
    # TODO: create step "Then the Age Association mandatory field should not be displayed in the Benerail extras" in benerail_results.steps.js
    # covers: List_length() — verifies the extras list does NOT contain the Age Association mandatory entry
    Then the Age Association mandatory field should not be displayed in the Benerail extras
