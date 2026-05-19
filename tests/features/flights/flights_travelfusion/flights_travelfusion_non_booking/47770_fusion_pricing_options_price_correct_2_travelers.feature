# Test Name: 47770 fusion - prices are correct in pricing options for 2 travelers
# Status: Active
# Labels: Fusion,Regression,Flights,price,results,Pricing Options,multi pax,FailedFusion,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-06-30T08:52:07Z
# Updated: 2025-04-27T09:31:54Z

@regression @flights @fusion @pricing-options @multi-pax @price @priority:high
Feature: 47770 Fusion - Pricing options price is correct for 2 travelers
  As a corporate travel arranger searching Fusion flights for 2 travelers
  I want the first pricing option price to match the first flight result price
  So that prices are consistent between results and pricing options

  Scenario: First pricing option price matches first flight result price for 2 travelers
    Given I am logged in as "Uzi@Yonon.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "shani cohen"
    When I search for a round trip flight from "DUS" to "VIE"
    And I click proceed button if visible
    Then flight results should be available
    When I extract the price for the first flight result and store it
    And I click to open first pricing options
    Then the first pricing option price should match the stored first flight result price
