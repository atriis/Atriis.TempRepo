# Test Name: 31334 GDG: Galileo - Specific car search without errors
# Description:
# Status: Active
# Labels: Cars,Galileo,Regression,No Amadeus Hotel Book,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-05T03:14:38Z
# Updated: 2025-09-11T01:33:31Z
# ADO Test Case: #31334 - GDG: Galileo - Specific car search without errors

@transportation @cars @regression @provider:galileo @booking @ado:31334
Feature: 31334 - Galileo - Specific Car Search Without Errors

  Scenario: Search for cars at specific locations with Galileo and verify results
    Given I am logged in as "vinicius@bengalileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car from "Walsall, UK" to "The Turf Hotel, Mold Road, Wrexham, UK" with 1 months ahead
    And the first station should have a "Select" button
    And the first station should have a "See details" button
    And I select the first city center pickup location
    And the first station should have a "Select" button
    And the first station should have a "See details" button


