# Test Name: 67510 BenerailMoove - Improvement for Journey Summary (Direct/Changes)
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-09-24T02:08:53Z
# Updated: 2025-09-26T03:48:57Z
@transportation @rails @benerail @regression
Feature: 67510 Benerail - Journey summary shows Direct or number of Changes correctly
  As a corporate traveler
  I want to see whether a Benerail journey is direct or includes changes in the results summary
  So that I can make an informed choice based on journey complexity

  Scenario: Benerail journey summary correctly shows number of changes for indirect journeys
    Given I am logged in as "testim@benemoove.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToAmsterdamCe"
    And I wait for select text to be visible
    Then the journey summary should show the same number of change dots as changes
