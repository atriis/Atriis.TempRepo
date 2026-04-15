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
  I want to filter by agreement hotels and see room level results displayed properly
  So that I can book from the company's negotiated hotel agreements

  @priority:medium
  Scenario: Room level results are displayed when agreement is configured with "Separate from other agreement" checked
    Given I am logged in as "suzanavond" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    Then handshake badge should be visible in hotel level results
    And I select the first hotel result
    When I wait for the first add to trip button to be visible in room level results
    Then the "amadeus" supplier logo should be visible in hotel results
