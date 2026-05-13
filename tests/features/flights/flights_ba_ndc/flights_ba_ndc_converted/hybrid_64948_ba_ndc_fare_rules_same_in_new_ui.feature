# Test Name: HYBRID for 64948 BA NDC - Fare rules are the same in GTP and New UI - New UI portion
# Description:
# Status: Active
# Labels: Flights,Fare Rules,BA NDC Regression,hybrid,NDC,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-30T09:24:29Z
# Updated: 2025-07-30T10:50:48Z

@regression @flights @ndc @ba @fare-rules
Feature: hybrid_64948 BA NDC - Fare rules are the same in new UI (new UI portion)

  As a corporate traveler
  I want to view BA NDC fare rules in the new UI
  So that I can verify they match the GTP fare rules

  Scenario: Fare rules are accessible and show Fare Basis content in new UI
    Given I am logged in as "iancurtis@ndcba.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "DUB"
    Then flight results should be available
    When I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I click the fare basis tab in fare rules
    Then the fare basis section should be visible in fare rules
