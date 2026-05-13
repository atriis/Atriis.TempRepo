# Test Name: 40952 MERGED Galileo car booking + travel policy for car + ECO car options
# Description:
# Status: Active
# Labels: Galileo,Cars,Full Purchase,Gray Dawes,Travel policy,OOP,Regression,Filters,No Amadeus Hotel Book,Sanity,Pre Prod,progress page,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-25T01:28:08Z
# Updated: 2025-07-10T04:07:14Z
@regression @cars @provider:galileo
Feature: 40952 Galileo car booking with travel policy and eco validations
  As a corporate traveler
  I want Galileo car results to reflect travel policy and eco indicators
  So that I can complete policy-compliant bookings with the correct justifications

  @priority:critical
  Scenario: Validate OOP state, eco options, justification flow, and successful booking
    Given I am logged in as "gal@leo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "lhr"
    Then the out of policy indicator should be visible in results
    # TODO: Map Testim step validate_low_emission_cars() to reusable results assertions for eco/low-emission content.
    When I add the first car to cart
    Then the out of policy indicator should be visible in cart
    # TODO: Map Testim step validate_cant_proceed_without_filling_justification().
    # TODO: Map Testim step fill_justification() to an existing cart justification workflow.
    When I click the proceed to checkout button
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
