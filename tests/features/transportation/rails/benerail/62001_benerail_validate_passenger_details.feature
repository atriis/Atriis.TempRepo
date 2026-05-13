# Test Name: 62001 Benerail - validate passenger details
# Description: Validate passenger details
# Status: Active
# Labels: Full Purchase,Daily Transportation,Regression,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-08T02:15:02Z
# Updated: 2026-02-06T03:27:06Z
@wip @transportation @rails @benerail @regression @priority:critical
Feature: 62001 Benerail - Passenger details validation for multiple travelers
  As a corporate traveler booking for multiple passengers
  I want to see the passenger details panel correctly populated in Benerail results
  So that I can confirm each traveler's information before adding to cart

  Scenario: Benerail passenger details are correctly displayed for three travelers
    Given I am logged in as "testim@benerail.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Secbene Moove"
    And I have added a random guest traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    # TODO: create step "When I select a Benerail result container to see passenger details" in benerail_results.steps.js
    # covers: Select_Container() — clicks on a result to expand the passenger info section
    When I select a Benerail result container to see passenger details
    # TODO: create step "Then the passenger details should be correctly displayed in Benerail results" in benerail_results.steps.js
    # covers: Passenger_Info() — validates details for all 3 passengers appear correctly
    Then the passenger details should be correctly displayed in Benerail results
