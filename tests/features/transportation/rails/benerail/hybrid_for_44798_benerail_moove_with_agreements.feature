# Test Name: hybrid_for_44798 Benerail Moove - With agreements
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation
# Owner: pini harush
# Created: 2025-01-01T00:00:00Z
# Updated: 2026-01-19T07:43:56Z
@wip @transportation @rails @benerail @regression
Feature: hybrid_for_44798 Benerail Moove - With agreements
  As a corporate traveler
  I want to search for a Benerail train with an agreements-configured account
  So that I can verify the search tab is still accessible after searching with agreements

  Scenario: Search tab remains visible after Benerail search with agreements account
    Given I am logged in as "beny@agriman.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlaho"
    # TODO: create step "Then the Benerail search tab should still be visible" in benerail_results.steps.js
    # covers: waitForText("ul > li:nth-of-type(1) a", 'Search') — validates that the Search tab link
    # remains present in the navigation after performing a search with an agreements-configured account
    Then the Benerail search tab should still be visible
