# Test Name: 66963 Evolvi - Stations are displayed in journey 'More Details'
# Description:
# Status: Active
# Labels: Rail,Evolvi,Regression,results,more details,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-10T02:23:47Z
# Updated: 2025-09-11T09:34:34Z
@transportation @rails @evolvi @regression @wip
Feature: 66963 Evolvi - Stations are displayed in journey 'More Details'
  As a traveler booking UK rail
  I want to open the journey 'More Details' of an Evolvi result
  So that I can see the departure and arrival stations and the travel mode of the journey

  Scenario: Stations are displayed in the Evolvi journey More Details
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "ldsToDon"
    And I dismiss the mandatory notifications popup if displayed
    # TODO: assert the outbound journey header is displayed on the Evolvi results page
    Then the outbound journey header should be displayed in the Evolvi results
    # TODO: assert the first outbound Evolvi result is labelled with the given number of changes, e.g. "Direct"
    And the first Evolvi outbound result should be marked as "Direct"
    # TODO: open the journey 'More Details' panel of the first outbound Evolvi result
    When I open more details for the first Evolvi outbound result
    # TODO: assert the journey details table lists the given departure station in its first row and the given arrival station in its last row
    Then the journey details should show the departure station "Leeds" and the arrival station "Doncaster"
    # TODO: assert the travel mode column of the first journey details row shows the given mode
    And the journey details travel mode should be "TRAIN"
