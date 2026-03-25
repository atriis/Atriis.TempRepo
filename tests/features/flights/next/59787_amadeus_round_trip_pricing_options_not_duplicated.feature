# Test Name: 59787 Amadeus - Round Trip Flight - Pricing Options are not duplicated
# Status: Active
# Labels: Regression,Amadeus,Flights,additional pricing options,Pricing Options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-25T09:09:08Z

@regression @amadeus @flights @pricing_options
Feature: 59787 Amadeus - Round trip pricing options are not duplicated
  As a corporate traveler
  I want to view pricing options for a round trip flight
  So that I can confirm each segment shows distinct pricing options

  Scenario: Pricing options are not duplicated for round trip flight
    Given I am logged in as "taylor" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "MNL"
    And I click proceed on the reference fields popup
    And I wait for add to trip text to be visible
    And I click to open first pricing options
    # TODO: Verify pricing options for outbound and inbound segments have different prices
    # Original Testim: Extracts price from ".flicking-camera > :nth-child(1) .price-wrapper > :nth-child(2) .amount"
    # Then scrolls until "Flight To" heading appears, extracts second segment price
    # And verifies the two prices are NOT equal (tolerance 0.09)
    # Proposed new step: Then the pricing options for each segment should have different prices
