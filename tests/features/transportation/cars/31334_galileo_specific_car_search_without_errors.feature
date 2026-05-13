# Test Name: 31334 GDG: Galileo - Specific car search without errors
# Description:
# Status: Active
# Labels: Cars,Galileo,Regression,No Amadeus Hotel Book,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-05T03:14:38Z
# Updated: 2025-09-11T01:33:31Z
@regression @cars @provider:galileo
Feature: 31334 Galileo specific car search without errors
  As a corporate traveler
  I want to search cars with different pickup and drop-off locations
  So that Galileo location-specific searches complete without UI errors

  @priority:high
  Scenario: Search for a specific Galileo car route without errors
    Given I am logged in as "vinicius@galileo.car" booking a new trip
    And I have added myself as the traveler
    When I search for a car from "Walsall, UK" to "The Turf Hotel, Mold Road, Wrexham, UK"
    # TODO: Map Testim assertions that the first station shows 'Select' and 'See details'.
