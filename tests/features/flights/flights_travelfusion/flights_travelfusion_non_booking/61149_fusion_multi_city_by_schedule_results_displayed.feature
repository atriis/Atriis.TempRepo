# Test Name: 61149 Fusion - Search by Schedule Multi City - Results are displayed
# Status: Active
# Labels: Regression,Flights,Fusion,multi city,by schedule,results,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-23T07:25:08Z
# Updated: 2025-09-14T10:46:29Z

@regression @flights @fusion @multi-city @by-schedule @priority:medium
Feature: 61149 Fusion - Multi-city by-schedule search returns results
  As a corporate traveler performing a multi-city by-schedule search via Fusion
  I want flight results to be displayed for all legs
  So that I can plan a multi-city itinerary

  Scenario: Multi-city by-schedule Fusion search returns results for all legs
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city by-schedule flight with legs "BRS-GLA" and "GLA-AMS" and "AMS-BRS"
    And flight results should be available
    When I select one flight segment by schedule
    And I wait for the change flight button to be visible
    Then "GLA-AMS" leg should have results available
    When I select one flight segment by schedule
    Then "AMS-BRS" leg should have results available
