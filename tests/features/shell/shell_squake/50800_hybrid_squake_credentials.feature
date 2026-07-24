# Test Name: HYBRID for 50800 squake credentials
# Description:
# Status: Active
# Labels: Regression,CO2,Flights,hybrid,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-11-10T09:05:07Z
# Updated: 2024-11-10T11:11:39Z

@regression
Feature: 50800 HYBRID Squake - CO2 credentials
  As a travel platform
  I want the correct Squake CO2 credentials to be used per company configuration
  So that emissions data is retrieved for both default and administration-configured companies

  @priority:medium
  Scenario: No squake in content - default credentials are used
    Given I am logged in as "Costa@Shtaim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available

  @priority:medium
  Scenario: Squake in content - credentials from the administration are used
    Given I am logged in as "Squake@cor.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available
