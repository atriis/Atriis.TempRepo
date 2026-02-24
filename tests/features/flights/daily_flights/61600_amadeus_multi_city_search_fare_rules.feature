@daily_flights @provider:amadeus @regression
Feature: 61600 Amadeus - Multi city search, fare rules displayed
  As a corporate traveler using Amadeus
  I want to search for a multi-city flight and view the fare rules
  So that I can verify fare rules are correctly displayed for multi-leg itineraries

  @priority:high
  Scenario: Multi-city search BRU-FRA-DFW-BRU with fare rules visible in results
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "BRU-FRA" and "FRA-DFW" and "DFW-BRU"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I should click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    And I should click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
