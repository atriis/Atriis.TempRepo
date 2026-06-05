# Test Name: 44881 Loader is there
# Description:
# Status: Active
# Labels: Regression,search,2026 plan 1
# Owner: pini harush
# Created: 2024-04-16T07:15:45Z
# Updated: 2025-09-14T09:08:47Z

@regression @shell @flights @search
Feature: 44881 - Loader is there
  As a corporate traveler
  I want the search loading screen to appear after submitting a flight search
  So that I know the system is processing my request and results are on their way

  Scenario: Search loading screen is displayed after submitting a flight search
    Given I am logged in as "pax@prebook.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then the search loading screen should be visible
