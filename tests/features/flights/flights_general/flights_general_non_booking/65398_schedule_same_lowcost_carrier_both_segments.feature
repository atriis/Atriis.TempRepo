# Test Name: 65398 Amadeus – Search by Schedule - Validate Inclusion of Both Segments in Round Trip with Same Low-Cost Carrier
# Status: Active
# Labels: Flights,by schedule,Amadeus,Regression,Ypsilon,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-01T11:29:01Z
# Updated: 2025-09-23T09:56:41Z

@regression @flights @general @by-schedule @amadeus @low-cost
Feature: 65398 Amadeus - Validate both segments included with same low-cost carrier
  As a corporate traveler
  I want both outbound and return segments included in a round trip by schedule
  So that the booking includes both legs when using the same low-cost carrier

  Scenario: Both segments are present when using same low-cost carrier (EasyJet)
    Given I am logged in as "corporate_amadeus_lcc" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "AMS" to "LON"
    And I filter results by carrier "EasyJet"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "EasyJet"
    And I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    And I add the first Additional pricing options fare to trip
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    And both outbound and return segments should be present in the trip
