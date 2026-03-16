# Test Name: 65381 NL Gov - Amadeus - Not displaying received agreement results
# Description: 
# Status: Active
# Labels: Daily Shell,Regression,Amadeus,Hotel,2026 plan 2
# Owner: Yael
# Created: 2025-08-07T01:01:03Z
# Updated: 2025-08-13T09:49:02Z

@regression @provider:amadeus
Feature: 65381 NL Gov - Amadeus - Agreement is displayed in results
  As a corporate traveler using Amadeus for NL government
  I want to filter by agreement hotels and see government-contracted hotels
  So that I can book within the approved government hotel agreements

  @priority:high
  Scenario: Agreement is displayed in results
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "BRU" for 1 night
    And I wait to see view rates text in results page
    When I filter results by "TMC" checkbox
    Then handshake badge should be visible in hotel level results