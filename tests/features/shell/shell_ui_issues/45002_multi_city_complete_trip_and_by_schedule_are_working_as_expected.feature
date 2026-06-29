# Test Name: 45002 Multi city - "Complete trip" and "By schedule" are working as expected
# Description:
# Status: Active
# Labels: Regression,UI,by schedule,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-23T10:24:11Z
# Updated: 2025-09-14T09:10:52Z

@regression @shell @flights @by_schedule @multi_city
Feature: 45002 - Multi city "Complete trip" and "By schedule" are working as expected
  As a corporate traveler
  I want the multi-city search to correctly switch between "Complete trip" and "By schedule" modes
  So that the search type reflects the expected mode when legs are added or removed

  Scenario: Complete trip switches to By schedule and reverts when the last flight leg is removed
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "LON-MAD" and "MAD-BKK" with cabin class "Business" without clicking search button
    Then the search type should be "By schedule"
    When I remove the last flight leg from the multi-city search
    Then the search type should be "Complete trip"
