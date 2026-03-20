# Test Name: 57338 Galileo - Hotel - "Filter non agreement GDS hotels" works as expected
# Description: 
# Status: Active
# Labels: Galileo,Hotel,Regression,Agreement,GDS,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-27T02:09:07Z
# Updated: 2025-07-21T03:34:09Z

@regression @provider:galileo
Feature: 57338 Galileo - Agreement badge visible in hotel and room level
  As a corporate traveler using Galileo
  I want to see the agreement badge on hotels in both hotel level and room level views
  So that I can identify negotiated-rate properties throughout the booking flow

  @priority:high
  Scenario: Agreement badge is visible in hotel level and room level for Galileo
    Given I am logged in as "canisso" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    Then handshake badge should be visible in hotel level results
    Then TMC badge filter should be visible in hotel level results
    And I select the first hotel result
    When I wait for the first add to trip button to be visible in room level results
    Then handshake badge should be visible in room level results
    Then TMC badge filter should be visible in room level results