# Test Name: 59183 Amadeus - Hotel - Room level results are displayed when agreement is configured with "Separate from other agreement" checked
# Description: 
# Status: Active
# Labels: Regression,Hotel,Amadeus,room level,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-10T10:09:31Z
# Updated: 2025-07-07T10:24:14Z

@regression @provider:amadeus
Feature: 59183 Amadeus - Hotel - Room level results are displayed when agreement is configured with "Separate from other agreement" checked
  As a corporate traveler
  I want to get hotels and room results with agreement even if the agreement is configured with "Separate from other agreement" checked

  @priority:medium
  Scenario: Room level results are displayed when agreement is configured with "Separate from other agreement" checked
    Given I am logged in as "separate@fromtmc.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Mexico city" for 1 night
    And I wait to see view rates text in results page
    Then handshake badge should be visible in hotel level results
    And hovering over the "Agency rate" agreement should show "WTT" in the tooltip
    And I select the first hotel result
    When I wait for the first add to trip button to be visible in room level results
    Then hovering over the "Agency rate" agreement in room level results should show "WTT" in the tooltip
