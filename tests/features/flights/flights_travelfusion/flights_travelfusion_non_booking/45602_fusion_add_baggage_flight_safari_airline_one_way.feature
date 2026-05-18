# Test Name: 45602 Fusion - Can add baggage flight safari airline one way only
# Status: Active
# Labels: Regression,Fusion,Flights,baggage,FailedFusion,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-02T08:17:27Z
# Updated: 2024-07-10T08:41:25Z

@regression @flights @fusion @baggage @flight-safari @priority:medium
Feature: 45602 Fusion Flight Safari Airline - Add baggage on one way flight
  As a corporate traveler booking a Flight Safari one way flight via Fusion
  I want to add baggage to my flight in cart
  So that my baggage selection is saved on the booking

  Scenario: Add baggage to Flight Safari one way flight and verify it is saved
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JNB" to "CPT"
    Then flight results should be available
    When I filter results by carrier "FA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the baggage extras section
    And I select a baggage option
    And I click the save button
    Then the baggage green icon should be visible