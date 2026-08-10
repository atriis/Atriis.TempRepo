# Test Name: 47148 Benerail - Air-Rail Mixed message does not take long to load and page does not get stuck when clicking on "Rail Options"
# Description:
# Status: Active
# Labels: Regression,Rail,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-23T09:30:29Z
# Updated: 2025-12-12T01:04:11Z
@transportation @rails @benerail @regression
Feature: 47148 Benerail - Air-Rail mixed message loads quickly and Rail Options page does not get stuck
  As a corporate traveler searching for a flight with available rail alternatives
  I want the Air-Rail mixed message to appear without delay
  So that I can click Rail Options and see Benerail results without the page getting stuck

  Scenario: Air-Rail available message appears and Rail Options can be clicked without page freeze
    Given I am logged in as "alvaresazevedo@travelpolicyhotel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "VIE" to "MUC"
    And I click proceed button if visible
    And I wait for add to trip text to be visible
    Then the rail banner should be visible in results
    When I click the rail options button in flight results
    Then I wait for select text to be visible
