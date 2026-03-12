# Test Name: 40950 Expedia - Expedia content will be displayed even when GDS content is switched on
# Description: 
# Status: Active
# Labels: Expedia,Hotel,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-05T11:27:11Z
# Updated: 2024-01-05T02:30:46Z

@regression @provider:expedia
Feature: 40950 Expedia - Expedia supplier logo is displayed in hotel results
  As a corporate traveler
  I want to see the Expedia supplier logo in hotel results
  So that I know which supplier is providing the hotel content

  @priority:medium
  Scenario: Expedia logo is visible in hotel level results
    Given I am logged in as "edi" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Budapest" for 1 night
    And I wait to see view rates text in results page
    Then the "Expedia" supplier logo should be visible in hotel results
