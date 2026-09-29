# Test Name: 85475 Galileo NDC - Fare rules show a tab per leg on a round trip with a connection
# Bug 85475: on a round trip with a connection, the fare rules drawer showed only the outbound leg,
# not a tab for each leg. The 1-stop filter keeps the test on the connecting itinerary the bug needs.

@ado:85475 @tc:85657 @regression @provider:travelport_ndc @flights @galileo @ndc @fare_rules @round_trip @priority:high
Feature: 85657 Galileo NDC - Fare rules show a tab per leg on a round trip with a connection

  Scenario: United 1-stop round trip fare rules show a tab per leg
    Given I am logged in as "pax@tvpNdc.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "BOS"
    And flight results should be available
    And I filter results by carrier "United"
    And I filter results by "1 stop" checkbox
    And I click to open fare rules
    Then the fare rules leg tabs should be "LIS - BOS, BOS - LIS"
