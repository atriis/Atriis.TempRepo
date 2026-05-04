# Test Name: 60528 Sabre - Results displayed when NDC & GDS content and flight duration > 24 hrs
# Status: Active
# Labels: Regression,Sabre,Sabre NDC,results,Frosch,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-03T07:28:33Z
# Updated: 2025-04-03T07:53:37Z

@regression @flights @sabre @sabre-ndc @results
Feature: 60528 Sabre - Results displayed when NDC and GDS content and flight duration over 24 hrs
  As a corporate traveler
  I want to see flight results for long-haul routes with both NDC and GDS content
  So that I can book flights even when duration exceeds 24 hours

  Scenario: Flight results are displayed for SYD-LHR with NDC and GDS content
    Given I am logged in as "displayresults" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "SYD" to "LHR"
    Then flight results should be available
