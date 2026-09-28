# Test Name: 65381 NL Gov - Amadeus - Not displaying received agreement results
# Description: 
# Status: Active
# Labels: Daily Shell,Regression,Amadeus,Hotel,2026 plan 2
# Owner: Yael
# Created: 2025-08-07T01:01:03Z
# Updated: 2025-08-13T09:49:02Z

@regression @provider:amadeus
Feature: 65381 Agreement from the user profile is displayed in results
  As a corporate traveler that has agreement in the profile
  I want to see results with the agreement from the profile in hotel and room level

  @priority:high
  Scenario: Agreement is displayed in results
    Given I am logged in as "agreement@fromuser.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Washington" for 1 night
    And I wait to see view rates text in results page
    Then handshake badge should be visible in hotel level results
    And hovering over the "Agency rate" agreement should show "AAA" in the tooltip
    When I select the first hotel result
    Then hovering over the "Agency rate" agreement in room level results should show "AAA" in the tooltip