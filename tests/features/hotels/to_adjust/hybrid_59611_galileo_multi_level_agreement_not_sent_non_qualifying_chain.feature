# Test Name: HYBRID for 59611 Galileo hotels - we don't send multi level agreement in the room level in case "AvailableForOtherRates" and hotel chain is not from list
# Description: 
# Status: Active
# Labels: Regression,Hotel,No Amadeus Hotel Book,Galileo,Agreement,multi agreement,hybrid,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-03-16T07:46:58Z
# Updated: 2025-11-10T11:17:18Z

@regression @provider:galileo
Feature: 59611 Galileo - Multi-level agreement not sent in room level for non-qualifying hotel chains
  As a corporate traveler using Galileo with multi-level agreement configuration
  I want to verify that multi-level agreement is only sent for hotels from the configured chain list
  So that agreement rates are only applied to qualifying hotel chains

  @priority:high
  Scenario: Multi-level agreement not sent for hotel chain outside configured list
    Given I am logged in as "galileo" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "SFO" for 1 night
    # TODO: Create step "When I select a hotel that is NOT from the configured chain list" that calls DSL selectHotelNotFromChainList in HotelSearch.js
    # TODO: Create step "Then multi-level agreement should NOT be sent in the room level request" - hybrid: validate via Galileo API log that multi-level agreement is absent
    # TODO: Create step "When I select a hotel that IS from the configured chain list" that calls DSL selectHotelFromChainList in HotelSearch.js
    # TODO: Create step "Then multi-level agreement SHOULD be sent in the room level request" - hybrid: validate via Galileo API log that multi-level agreement is present
