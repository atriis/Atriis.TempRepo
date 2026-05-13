# Test Name: 34821 - benerail moove, price for multiple travelers displayed correctly
# Description:
# Status: Active
# Labels: Full Purchase,NL government,Keeps failing,Benerail Moove Regression,Bene seats,Daily Transportation,Transportation,2026 plan 1,02
# Owner: Shani Hadar
# Created: 2024-03-10T10:22:19Z
# Updated: 2025-12-19T03:00:57Z
@wip @transportation @rails @benerail @regression
Feature: 34821 Benerail - Price for multiple travelers displayed correctly
  As a corporate traveler booking for two people
  I want the total Benerail price to correctly reflect the cost for both travelers
  So that the displayed price is accurate before proceeding to checkout

  Scenario: Benerail price for two travelers is calculated and displayed correctly
    Given I am logged in as "beny@benerail.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a round trip Benerail train from "bebmiToNlban"
    And I click proceed on the reference fields popup
    When I add a Benerail round trip to the trip
    # TODO: create step "And I set the age association for the second traveler" in benerail_results.steps.js
    # covers: choose_age_association() — selects age group for the guest/second traveler
    And I set the age association for the second traveler
    # TODO: create step "Then the total price should reflect both travelers correctly" in benerail_results.steps.js
    # covers: Validate_total_for_2_travelers() — validates total price = traveler1 + traveler2 price
    Then the total price should reflect both travelers correctly
    When I proceed to checkout
    When I complete the booking
    # TODO: create step "Then the booking status should show In Progress or Finalizing" in benerail_results.steps.js
    # covers: waitForText(".quote-results__status", /In Progress|Finalizing/) with tooltip hover
    Then the booking status should show "In Progress" or "Finalizing"
    When I cancel the Benerail trip with warning and continue
