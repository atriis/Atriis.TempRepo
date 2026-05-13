# ADO Bug #74210 - (OBT) Fusion - By Schedule - Case when no results in pricing options
# Severity: 1 - Major | Priority: 2
# Domain: Flights | Supplier: Fusion | Carrier: Vueling (also reproduced with Ryanair, Wizz Air)
# Application: Traveller - OBT
# Route from repro steps: OVD → AMS (round trip, by schedule)
# User: veulingWeb@TFreg.club
# Issue: When searching flights by schedule and selecting fares from pricing options,
#        the pricing page shows no results (no fares displayed)
# Expected: Pricing options display available Fusion fares for both outbound and return segments

@regression @flights @fusion @by-schedule @ado:74210 @priority:critical
Feature: 74210 Fusion By Schedule - Pricing options display fares for both segments
  As a corporate OBT user searching Fusion flights by schedule
  I want pricing options to show available fares for outbound and return segments
  So that I can successfully select and add a Vueling round-trip by-schedule flight to my trip

  Scenario: Vueling round-trip by-schedule search returns pricing options for outbound and return segments
    Given I am logged in as "veuling@web.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "OVD" to "AMS"
    And I filter results by carrier "Vueling"
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I filter results by carrier "Vueling"
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
