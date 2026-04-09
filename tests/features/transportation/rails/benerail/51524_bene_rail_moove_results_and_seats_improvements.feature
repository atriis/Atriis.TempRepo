# Test Name: 51524 Bene rail Moove> results and seats improvements
# Description: check improvements on results page (earlier and later) and seats
# Status: Active
# Labels: No Amadeus Hotel Book,Benerail Moove Regression,Bene seats,Rail,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-09-08T02:15:43Z
# Updated: 2025-09-02T05:00:45Z
@wip @transportation @rails @benerail @regression
Feature: 51524 Benerail - Results page earlier/later navigation and seat improvements
  As a corporate traveler
  I want to navigate earlier/later results and verify seat selection improvements
  So that I can confirm results pagination and seating UI work correctly

  Scenario: Benerail results page earlier and later navigation with seat improvements
    Given I am logged in as "beny" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "defraToBebmi"
    And I click proceed on the reference fields popup
    # TODO: create step "Then the Benerail results page improvements should be visible" in benerail_results.steps.js
    # covers: Bene__check_results_page() — validates Earlier/Later buttons, result count, prices visible
    Then the Benerail results page improvements should be visible
    # TODO: create step "Then the seat price should not be included in the journey price" in benerail_results.steps.js
    # covers: Seating_not_visible_in_price() — confirms seat charges are shown separately, not in base price
    Then the seat price should not be included in the journey price
    # TODO: create step "Then the seat selection improvements should be validated in results" in benerail_results.steps.js
    # covers: Bene__validate_seats__TBD() — TBD validation steps for seats in results
    Then the seat selection improvements should be validated in results
