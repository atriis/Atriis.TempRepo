# Test Name: 57962 Travel Policy - Flight - System is able to diferenciate city and airport in a travel policy
# Description:
# Status: Active
# Labels: Travel policy,Flights,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-11T06:26:37Z
# Updated: 2025-02-11T06:53:17Z

@regression @travel_policy @flights @shell
Feature: 57962 Travel Policy - City vs airport differentiation in flight policy

  As a corporate traveler
  I want the system to differentiate between city and airport codes in travel policy
  So that policies are applied based on the correct geographic scope

  Scenario: Flight from LHR to PAR does not trigger OOP when policy targets airport not city
    Given I am logged in as "veronicaoliveira@travelpolicyflight.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "PAR"
    Then the "Add to trip" text should be visible in results
    And the out of policy indicator should not be visible in results
