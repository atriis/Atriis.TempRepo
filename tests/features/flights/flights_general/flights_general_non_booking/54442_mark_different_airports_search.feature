# Test Name: 54442 Mark different airports in search
# Status: Active
# Labels: Regression,Flights,results,Amadeus,multi city,2026 plan 1
# Owner: pini harush
# Created: 2024-11-26T02:13:54Z
# Updated: 2025-09-16T09:06:18Z

@regression @flights @general @multi-city
Feature: 54442 Flights - Mark different airports in search
  As a corporate traveler
  I want different airports to be marked in multi-city search
  So that I can identify airport changes between segments

  Scenario: Different airports are marked in multi-city search results
    Given I am logged in as "joana@amadeusandafklm.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "LHR-MXP" and "LIN-LCY"
    And I filter results by carrier "BA"
    Then airport codes "LHR" and "LCY" should be marked in the first flight result
