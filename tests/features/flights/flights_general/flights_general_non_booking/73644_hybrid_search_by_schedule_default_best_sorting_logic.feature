# Test Name: Hybrid for 73644: Search by Schedule - Default "Best" Sorting Logic
# Description:
# Status: Active
# Labels: Flights,Regression,general,Search Flight,by schedule
# Owner: Sonia Sousa
# Created: 2026-02-14T02:33:08Z
# Updated: 2026-02-14T03:54:28Z

@regression @flights @general @by-schedule @amadeus @hybrid
Feature: 73644 HYBRID By Schedule - Default Best sorting logic

  As a corporate traveler
  I want schedule search results to be sorted by Best by default
  So that the most balanced flight options are presented to me first

  @priority:medium
  Scenario: Schedule search results default to the Best sort option
    Given I am logged in as "corp.amadeus.reg.ss@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LON" to "JFK"
    And flight results should be available
    Then the "Best" sort option should be selected by default
