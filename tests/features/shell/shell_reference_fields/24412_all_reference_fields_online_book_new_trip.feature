# Test Name: 24412 All Reference fields online book new trip
# Description: Check all Reference fields in request assistance stage
# Status: Active
# Labels: Reference Fields,Regression,No Amadeus Hotel Book,Fit for Prod,2026 plan 1
# Owner: pini harush
# Created: 2023-02-12T02:21:21Z
# Updated: 2025-09-11T12:40:56Z

@shell @reference_fields @regression
Feature: 24412 - All reference fields on the new-trip stage during online booking

  As a booker creating a new trip online
  I want the configured reference and dynamic fields to appear at the new-trip stage
  So that I can supply the required information before viewing results

  Scenario: Reference and dynamic fields are displayed on the new-trip reference popup
    Given I am logged in as "Rf@testim.nl" booking a new trip
    When I initiate a hotel search in "London" for 1 night
    Then the reference fields popup should show the following labels:
    | New Trip Rf |
    | Search dyn |
    And I click proceed on the reference fields popup
    And I wait to see view rates text in results page
