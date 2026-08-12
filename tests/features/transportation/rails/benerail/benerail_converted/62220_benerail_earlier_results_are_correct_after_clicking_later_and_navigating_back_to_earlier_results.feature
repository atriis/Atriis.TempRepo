# Test Name: 62220 Benerail - Earlier results are correct after clicking 'Later' and navigating back to 'Earlier' results
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,results,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-20T07:45:15Z
# Updated: 2026-01-21T10:00:45Z
@transportation @rails @benerail @regression
Feature: 62220 Benerail - Earlier results are correct after clicking Later then navigating back to Earlier
  As a corporate traveler
  I want Earlier results to correctly reset to earlier departure times after I browse Later results
  So that I can navigate backward through Benerail results without stale data

  Scenario: Benerail earlier results are correctly displayed after clicking Later then Earlier
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    And I wait for select text to be visible
    When I extract the first result departure time
    Then the first Benerail result should depart from 06:00 or later
    And I click Later and extract the first result departure time
    When I click Earlier and extract the first result departure time
    Then the earlier results departure time should be before the later results time
