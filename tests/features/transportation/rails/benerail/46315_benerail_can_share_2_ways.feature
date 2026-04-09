# Test Name: 46315 benerail - can share 2 ways
# Description:
# Status: Active
# Labels: Regression,share quote,results,Bene seats,Daily Transportation,Benerail Moove Regression,Transportation,2026 plan 1,02
# Owner: pini harush
# Created: 2024-05-23T06:03:41Z
# Updated: 2025-09-19T11:16:50Z
@wip @transportation @rails @benerail @regression
Feature: 46315 Benerail - Can share price offer after selecting 2 ways in results
  As a corporate traveler
  I want to share the Benerail price offer after selecting both outbound and return journeys
  So that stakeholders can review both legs before booking

  Scenario: Benerail price offer shared after selecting both journey legs from results
    Given I am logged in as "beny" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    And I click proceed on the reference fields popup
    When I select the first Benerail option
    # TODO: create step "When I click the share icon in Benerail results" in benerail_results.steps.js
    # covers: page.click(".is-size-5") — share icon button in results page header
    When I click the share icon in Benerail results
    When I select the first Benerail option
    # TODO: create step "When I click the share price offer button in Benerail results" in benerail_results.steps.js
    # covers: page.click(".share-bar .btn--primary")
    When I click the share price offer button in Benerail results
    # TODO: create step "Then the Include in price offer option should be visible" in benerail_results.steps.js
    # covers: waitForText("[class^='mb']...", 'Include in price offer')
    Then the Include in price offer option should be visible
    And I send the share
