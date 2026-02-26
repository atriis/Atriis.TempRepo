# Test Name: 24004 Add and remove travelers
# Description: *add, remove and add again traveler (booker) - validate buttons: I'm the traveler and "add guest" - use primary
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,never failed,2026 plan 1
# Owner: pini harush
# Created: 2022-12-12T03:15:00Z
# Updated: 2026-02-16T03:03:13Z

@regression @provider:general
Feature: 24004 General - Add and remove traveler from trip
  As a travel arranger
  I want to add and remove myself as a traveler on a trip
  So that traveler management works correctly

  @priority:medium
  Scenario: Add myself as traveler, remove, then add again
    Given I am logged in as "general" "user_one"
    When I book a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I remove myself as the traveler" that calls DSL method removeTraveler in Search.js
    # TODO: Create step "When I add myself as the traveler again" that calls DSL method addMyselfAsTraveler in Search.js
    And I have added myself as the traveler
