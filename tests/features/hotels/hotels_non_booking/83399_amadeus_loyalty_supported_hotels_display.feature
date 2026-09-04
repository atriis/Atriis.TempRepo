# Test Name: 83399 Hotels - Hilton loyalty badge is displayed in hotel level and room level
# Description:
# Status: Active
# Labels: Regression,Hotel,Hotel loyalty number,hotel level,room level,conferma
# Owner: Bruna Santos
# Created: 2026-09-04T00:00:00Z
# Updated: 2026-09-04T00:00:00Z

@regression @hotels @hotel_loyalty
Feature: 83399 Amadeus - Hotels - Loyalty badge displayed in hotel level and room level
  As a corporate traveler searching for a Hilton property
  I want the Hilton loyalty programme badge shown both in the hotel list and on the room list
  So that I can tell at a glance that the stay earns loyalty points

  @priority:medium
  Scenario: Loyalty badge is displayed at hotel level and at room level
    Given I am logged in as "brunaconferma@conferma.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "DOUBLETREE LONDON WEST END" for 1 night
    And I wait to see view rates text in results page
    Then the "Hilton" loyalty badge should be visible in hotel level results
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the "Hilton" loyalty badge should be visible in room level results
