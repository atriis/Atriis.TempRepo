# Test Name: hybrid_for_44798 Benerail Moove - With agreements
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation
# Owner: pini harush
# Created: 2025-01-01T00:00:00Z
# Updated: 2026-01-19T07:43:56Z
@transportation @rails @benerail @regression
Feature: 44798 HYBRID Benerail Moove - With agreements
  As a corporate traveler
  I want to search for a Benerail train with an agreements-configured account
  So that I can verify the search tab is still accessible after searching with agreements

  Scenario: Search tab remains visible after Benerail search with agreements account
    Given I am logged in as "beny@agriman.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToNlaho"
    And I click proceed button if visible
    Then I should see "Search" text in breadcrumb
    When I capture the "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" from Storage
    Then the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "770005021509".onKey("contractNr")
    And the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "urn:itti:supplier:EUR".onKey("supplier")
    Then the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "10110000".onKey("contractNr")
    And the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "urn:itti:supplier:EUR".onKey("supplier")
    Then the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "123456".onKey("contractNr")
    And the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "urn:itti:supplier:ICE".onKey("supplier")
    Then the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "770005021509".onKey("contractNr")
    And the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "urn:itti:supplier:ICE".onKey("supplier")