# Test Name: 65381 NL Gov - Amadeus - Not displaying received agreement results
# Description: 
# Status: Active
# Labels: Daily Shell,Regression,Amadeus,Hotel,2026 plan 2
# Owner: Yael
# Created: 2025-08-07T01:01:03Z
# Updated: 2025-08-13T09:49:02Z

@regression @provider:amadeus
Feature: 65381 Amadeus - Agreement filter shows NL government hotels
  As a corporate traveler using Amadeus for NL government
  I want to filter by agreement hotels and see government-contracted hotels
  So that I can book within the approved government hotel agreements

  @priority:high
  Scenario: Agreement filter displays correct NL government contracted hotels
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "BRU" for 1 night
    When I filter results by "Agreement" checkbox
    # TODO: Create step "Then the agreement hotel results should include NL government contracted properties" that calls DSL verifyNLGovAgreementResults in HotelSearch.js
