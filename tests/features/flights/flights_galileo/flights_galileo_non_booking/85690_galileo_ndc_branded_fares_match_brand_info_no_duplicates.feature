# Test Name: 85482 Galileo NDC - Branded fares match Brand Info with no duplicated attributes
# Bug 85482: the branded fares drawer listed the same attribute more than once with conflicting values
# (per-flight class of service, baggage on top of the brand's own carry-on), and chargeable items showed
# both in the main list and under "Ancillaries for additional charge". Round trip, so each brand spans
# two flights - the case that produced one class-of-service line per flight.

@ado:85482 @tc:85690 @regression @provider:travelport_ndc @flights @galileo @ndc @branded_fares @round_trip @priority:high
Feature: 85690 Galileo NDC - Branded fares match Brand Info with no duplicated attributes

  Scenario: TAP round trip branded fares match the Brand Info response
    Given I am logged in as "pax@tvpNdc.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "BER"
    And flight results should be available
    And I filter results by carrier "Tap Air Portugal"
    And I click to open pricing options for the first NDC direct rate result
    And I open branded fares from pricing options
    And I capture the "response" payload for request type "UAPI TVP NDC Brand Info*" from Storage
    Then the branded fares offered and not offered items should match the captured Brand Info
    And the branded fares chargeable items should be listed only under additional charge
    And the branded fares drawer should show each attribute only once
