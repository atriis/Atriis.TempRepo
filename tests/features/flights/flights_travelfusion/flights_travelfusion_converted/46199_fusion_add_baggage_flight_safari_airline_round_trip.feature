# Test Name: 46199 Fusion - Can add baggage flight safari airline one roundtrip
# Status: Active
# Labels: Regression,Fusion,Flights,baggage,FailedFusion,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-17T02:26:32Z
# Updated: 2024-09-27T11:29:34Z

@regression @flights @fusion @baggage @flight-safari @priority:medium
Feature: 46199 Fusion Flight Safari Airline - Add baggage on round trip flight
  As a corporate traveler booking a Flight Safari round trip flight via Fusion
  I want to add baggage to both segments
  So that my baggage selection is saved on the booking

  Scenario: Add baggage to Flight Safari round trip flight and verify it is saved
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "JNB" to "CPT"
    Then flight results should be available
    When I filter results by carrier "FA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement 'I add baggage for outbound and return Flight Safari segments' — see steps clicking '.flight-baggage .is-clickable', selecting outbound/return baggage and saving (test 46199)
    # TODO: implement 'the baggage filled indicator should be visible after saving' — isVisible('.flight-baggage .filled') in Testim source (test 46199)
    Then I successfully cancel the trip
