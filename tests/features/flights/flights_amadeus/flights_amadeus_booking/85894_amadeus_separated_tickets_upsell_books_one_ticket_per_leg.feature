# Test Name: [Automated] Amadeus - Separated Tickets fare picked in Pricing Options books one ticket per leg on its own validating carrier - ADO 85837
# Status: Active
# Labels: Regression,Flights,Amadeus,Edifact,separate tickets,Pricing Options,Hold
# Owner: Yael Alef
# Created: 2026-10-05

# ADO Test Case ID: 85894
# Source: ADO Bug #85837 - [Amadeus] Complete Trip - separate tickets (IB + SN one-way fares) priced as a
#         single ticket at booking - NO FARE FOR BOOKING CODE
#
# A classic Amadeus Separated Tickets result opened in Pricing Options is upsold once per leg and the
# per-leg options are recombined. The recombined option used to reach the cart as ONE round-trip quote
# validated by the first leg's carrier, so booking priced both segments together on that carrier and
# Amadeus answered "NO FARE FOR BOOKING CODE". It must now be saved as one quote per ticket and each
# ticket held with its own validating carrier.
# BRU-MAD on dev returns Brussels Airlines out / Air Europa back as the first Multi carrier result -
# both classic Amadeus (QA run 2026-10-05, trip 3915698).

@ado:85894 @regression @flights @amadeus @edifact @separate-tickets @pricing-options @hold
Feature: 85894 Amadeus - Separated Tickets fare picked in Pricing Options books one ticket per leg
  As a corporate traveler
  I want to hold a Separated Tickets fare I picked in Pricing Options
  So that each ticket is priced on its own airline instead of failing with NO FARE FOR BOOKING CODE

  Scenario: Separated Tickets classic Amadeus fare picked in Pricing Options holds each ticket separately
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BRU" to "MAD"
    Then flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    Then the "Separated Tickets" indicator should be visible in results

    When I click to open first pricing options
    And I select the outbound first option from pricing options page
    And I wait for the inbound leg in pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    Then the booking status should be "Pending booking"
    # The bug saved the recombined option as one round-trip quote on one validating carrier
    And the cart should contain 2 flight quotes

    # Each ticket carries its own contact-consent extra and T&C, and its own Hold flight button
    When I share the contact details with the airline for quote 1 if requested using email "ruimariano@amadeus.com"
    And I accept all Terms & Conditions on the page
    And I hold quote 1
    And I share the contact details with the airline for quote 2 if requested using email "ruimariano@amadeus.com"
    And I accept all Terms & Conditions on the page
    And I hold quote 2
    Then the last quote status should be "On hold"

    # Before the fix the single booking pricing for both segments was refused
    When I capture the "response" payload for request type "Amadeus4.Fare_PricePNRWithBookingClass" from Storage
    Then the captured "response" payload for request type "Amadeus4.Fare_PricePNRWithBookingClass" should not contain "NO FARE FOR BOOKING CODE"

    And I successfully cancel the trip
