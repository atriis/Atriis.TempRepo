# Test Name: 72984 don't see amadeus GDS in the results if inactive on user group level
# Description: 
# Status: Active
# Labels: Amadeus,Amadeus Value hotel,No Amadeus Hotel Book,Hotel,Regression,results,Preferred Hotels,2026 plan 2
# Owner: Shani Hadar
# Created: 2026-01-25T11:25:33Z
# Updated: 2026-02-16T12:19:22Z

@regression @provider:amadeus_value_hotel
Feature: 72984 Amadeus Value Hotel - Inactive supplier logo not displayed and filtered out
  As a corporate traveler
  I want to confirm that an inactive Amadeus Value Hotel supplier logo is not shown
  So that only active provider content is displayed in hotel results

  @priority:medium
  Scenario: Inactive Amadeus Value Hotel supplier logo is not visible in hotel results
    Given I am logged in as "papatinho" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Pittsburgh" for 1 night
    And I wait to see view rates text in results page
    Then the "Amadeus Aggregators" supplier logo should not be visible in hotel results
    And the "Amadeus Aggregators" supplier filter should not be visible
