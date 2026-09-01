# Test Name: 68009 BenerailMoove - Journey selection elements
# Description:
# Status: Active
# Labels: Rail,Benerail Moove Regression,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-09-26T03:19:55Z
# Updated: 2025-10-02T10:19:03Z
@transportation @rails @benerail @regression
Feature: 68009 Benerail - Journey selection stepper elements are displayed correctly
  As a corporate traveler selecting a Benerail round trip journey
  I want to see the journey selection stepper element for both outbound and return selections
  So that I can visually track my progress through the journey selection flow

  Scenario: Journey selection stepper element is displayed for both outbound and return legs
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToNlaho"
    And I wait for select text to be visible
    Then the Benerail journey stepper should show the outbound step highlighted and the inbound step default, both with their date and time
    And I select the first Benerail option
    Then the Benerail journey stepper should show the outbound step completed and the inbound step highlighted, both with their date and time
