# Test Name: 85820 Lufthansa NDC - Search by schedule - every traveller can add baggage for both flights of an Austrian round trip
# Source: ADO Bug #69684 - LH NDC - New UI - Only showing one segment for baggage selection
#
# 4 travellers on LHR-GRZ: each leg connects, so the quote has the 4 segments of the bug.

# ADO Test Case ID: 85820
@ado:85820
@regression @flights @ndc @lufthansa @baggage @multi-pax @by-schedule
Feature: 85820 Lufthansa NDC - Search by schedule - every traveller can add baggage for both flights of an Austrian round trip
  As a travel arranger booking an Austrian NDC round trip by schedule for several travellers
  I want the baggage selection to offer every flight for every traveller
  So that I can add baggage for each of them on the whole trip

  @priority:high
  Scenario: Each of 4 travellers gets a baggage selection for the outbound and return flights
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I start intercepting the "flightSearch" API response
    When I search for a flight by schedule from "LHR" to "GRZ" with preferred carrier "Austrian Air"
    Then flight results should be available
    And every "OS" result in the flight search response should be NDC
    When I select flight segments by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I click to edit the baggage extras section
    Then the baggage carrier should display "Austrian Air"
    And the baggage selection should show the "LHR - GRZ" and "GRZ - LHR" flights for each of the 4 travelers
    When I select a baggage option for every flight of every traveler
    And I click the save button
    Then I should see a success notification
    And every traveler should keep the baggage selected for each flight
