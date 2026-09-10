# Test Name: 72984 don't see amadeus GDS in the results if inactive on user group level
# Description: 
# Status: Active
# Labels: Amadeus,Amadeus Value hotel,No Amadeus Hotel Book,Hotel,Regression,results,Preferred Hotels,2026 plan 2
# Owner: Shani Hadar
# Created: 2026-01-25T11:25:33Z
# Updated: 2026-02-16T12:19:22Z

@regression @provider:amadeus_value_hotel
Feature: 72984 Amadeus Value Hotel - Active supplier served and inactive Amadeus GDS withheld
  As a corporate traveler
  I want hotel content to come only from the suppliers active for my user group
  So that an Amadeus GDS deactivated for my group cannot reach my results

  @priority:medium
  Scenario: Amadeus Value Hotel content is served while the inactive Amadeus GDS is withheld
    Given I am logged in as "papatinhosantos@amadeusvalue.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Paris, France" for 1 night
    And I wait to see view rates text in results page
    Then the "Amadeus Value Hotel" supplier logo should be visible in hotel results
    And the "Amadeus Value Hotel" supplier filter should be visible
    And the "Amadeus" supplier logo should not be visible in hotel results
    And the "Amadeus" supplier filter should not be visible
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the "Amadeus Value Hotel" supplier logo should be visible in room level results
    And the "Amadeus" supplier logo should not be visible in room level results
