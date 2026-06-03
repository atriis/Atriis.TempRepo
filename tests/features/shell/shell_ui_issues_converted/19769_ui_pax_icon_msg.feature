# Test Name: 19769 UI- pax icon msg
# Description: Testing the icon message in add traveler.
# Status: Active
# Labels: Adding Passengers,Regression,No Amadeus Hotel Book,Fit for Prod,never failed,2026 plan 1
# Owner: pini harush
# Created: 2022-12-13T01:29:17Z
# Updated: 2025-05-12T09:50:29Z

@regression @shell @travelers
Feature: 19769 UI - pax icon message in add traveler
  As a travel arranger
  I want to see the traveler list and traveler options when starting a trip
  So that the add traveler UI displays the correct icon message and controls

  @priority:medium
  Scenario: Travelers list and traveler checkbox options are displayed on a new trip
    Given I am logged in as "test@io.com"
    When I book a new trip
    Then the travelers list should be visible
    When I click the traveler name
    Then the traveler checkbox container should be visible
