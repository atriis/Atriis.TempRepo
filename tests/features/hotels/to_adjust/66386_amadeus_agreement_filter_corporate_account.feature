# Test Name: 66386 amadeus hotel agreemnst do not send correclty the hotel
# Description: 
# Status: Active
# Labels: Daily Hotels,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-08-27T11:30:52Z
# Updated: 2025-10-28T05:30:13Z

@regression @provider:amadeus
Feature: 66386 Amadeus - Agreement filter shows correct results for PwC account
  As a corporate traveler with a PwC account
  I want to filter by agreement hotels
  So that only PwC-negotiated hotels are shown in results

  @priority:high
  Scenario: Agreement filter returns correct results for PwC corporate account
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Cardiff Lane Dublin" for 1 night
    When I filter results by "Agreement" checkbox
    # TODO: Create step "Then agreement hotel results should be displayed for the corporate account" that calls DSL verifyAgreementResultsForCorporate in HotelSearch.js
