# Test Name: 85654 Lufthansa NDC - Mixed-brand round trip (Comfort out / Flex back) can be held
# Status: Active
# Labels: Regression,Flights,NDC,Lufthansa NDC Regression,Branded Fares,Pricing Options,Hold
# Owner: Yael Alef
# Created: 2026-09-29

# ADO Test Case ID: 85654
# Source: ADO Bug #85279 - [Flight][LH Group SPRK] FlightPrice reuses FareSearch FareRefKeys instead
#         of the OfferPrice ones - mixed-brand itinerary fails at booking
#
# A Farelogix FareRefKey names the response that minted it. On a mixed-brand itinerary the booking
# used to ship FareSearch keys next to OfferPrice keys, so Farelogix rejected it with "itinerary
# pricing failed" even though the cart had priced. The fix adopts the OfferPrice keys onto the
# packages booking reads. The oracle is the hold itself: a mixed-brand trip must reach "On hold".
#
# Hold, not Complete booking: this user tickets on booking, and a ticketed trip cannot be cancelled
# from the UI. The source-system check pins the Farelogix "Lufthansa" integration, not NDCLH.
# On Brussels Air BRU-ATH, picking Economy Comfort outbound leaves Comfort and Flex on the inbound.

@ado:85654
@regression @flights @ndc @lufthansa @branded-fares @pricing-options @hold @priority:high @provider:lufthansa
Feature: 85654 Lufthansa NDC - Mixed-brand round trip can be held

  As a corporate traveler
  I want to hold a Lufthansa Group round trip with a different brand on each leg
  So that a fare combination the cart priced does not fail when it is booked

  Scenario: Hold a Brussels Air round trip with Economy Comfort outbound and Economy Flex inbound
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I start intercepting the "flightSearch" API response
    And I search for a round trip flight from "BRU" to "ATH"
    Then flight results should be available
    And the intercepted response should have at least one result where "sourceSystem" is "LUFTHANSA"
    When I filter airline results by "Brussels Air" checkbox
    And I click to open first pricing options
    Then the "Economy Comfort" brand should be displayed in pricing options
    When I select the pricing option containing "Economy Comfort"
    And I wait for the inbound leg in pricing options page
    Then the "Economy Flex" brand should be displayed in pricing options
    When I select the pricing option containing "Economy Flex"
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I share the contact details with the airline if requested using email "claraaguiar@ndclhclara.com"
    And I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    Then I successfully cancel the trip
