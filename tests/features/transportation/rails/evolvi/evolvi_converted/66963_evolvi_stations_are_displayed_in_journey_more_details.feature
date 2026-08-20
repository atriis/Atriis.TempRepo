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
    And I acknowledge the push notification
    And I should see outbound text in Evolvi results page
    And the first Evolvi outbound time should be marked as "Direct"
    When I hover over first Evolvi outbound time information icon
    Then the journey details should show the departure station "Leeds" and the arrival station "Doncaster"
    And the journey details travel mode should be "TRAIN"
