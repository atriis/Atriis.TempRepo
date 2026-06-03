# Test Name: 34545 OOP - Net duration Travel policy is working correctly
# Description:
# Status: Active
# Labels: Regression,OOP,Travel policy,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-27T07:38:24Z
# Updated: 2025-02-27T09:55:35Z

@regression @travel_policy @oop @flights @shell
Feature: 34545 Travel Policy - Net duration OOP is triggered correctly

  As a corporate traveler
  I want the system to trigger OOP when net duration policy is violated
  So that the correct travel policy rule is applied based on destination and duration

  Scenario: OOP badge and tooltip display correct net duration policy violation
    Given I am logged in as "biancaoliveira@travelpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "CAI" to "DXB"
    And I filter results by carrier "EK"
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Destination is not europe and Net Duration is less than or equals 7 hours"
