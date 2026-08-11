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
    Given I am logged in as "beny@moove.com" booking a new trip
    And I have added myself as the traveler
    When I search direct only option for a one way Benerail train from "nlabkToNlasc"
    And I click proceed button if visible
    And I wait for select text to be visible
    And I open journey details for the first Benerail result
    Then the travel time should be displayed in the Benerail journey details panel
