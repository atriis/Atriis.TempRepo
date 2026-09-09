# Test Name: 73419 Transferz - After editing search, results are displayed
# Description:
# Status: Active
# Labels: Transferz Regression,search,edit,Transportation
# Owner: Bruna Santos
# Created: 2026-02-03T09:10:23Z
# Updated: 2026-09-09T13:10:04Z

@regression @transportation @ground_transport @provider:transferz @search @edit
Feature: 73419 Transferz - Results are displayed after editing the search

  As a corporate traveler
  I want to go back from the Transferz results to the search form and change my criteria
  So that a reversed route with a different pick-up time still returns transfer options

  Scenario: Transferz returns results again after the search is reversed from the results breadcrumb
    Given I am logged in as "betoribeiro@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from specific address "Emirates Stadium, Hornsey Road, London, UK" to airport "LHR"
    Then ground transport results should be displayed
    And the ground transport results should be for pickup "Emirates Stadium" and drop off "LHR"
    When I navigate back to ground transport search via breadcrumb
    And I search for ground transport from airport "LHR" to specific address "Emirates Stadium, Hornsey Road, London, UK" changing the pickup time
    Then ground transport results should be displayed
    And the ground transport results should be for pickup "LHR" and drop off "Emirates Stadium"
