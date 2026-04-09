# Test Name: hybrid_for_61642 Benerail Moove - Corporate program is being correctly sent
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation
# Owner: pini harush
# Created: 2025-01-01T00:00:00Z
# Updated: 2026-01-19T07:43:56Z
@wip @transportation @rails @benerail @regression
Feature: hybrid_for_61642 Benerail Moove - Corporate program is being correctly sent
  As a corporate traveler
  I want to book a one way Benerail trip with a corporate program account
  So that I can confirm the corporate program identifier is correctly sent in the booking request

  Scenario: Corporate program is correctly sent during Benerail one way booking
    Given I am logged in as "bruolisan" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    When I add a Benerail one way to the trip
    When I proceed to checkout
    When I complete the booking
    # TODO: create step "When I cancel the Benerail trip with warning and continue" in benerail_results.steps.js
    # covers: Trip_Cancelation___warning_and_continue() — cancels trip via UI but there is a warning dialog
    # that requires an additional confirmation step beyond the standard Trip_Cancelation flow
    When I cancel the Benerail trip with warning and continue
