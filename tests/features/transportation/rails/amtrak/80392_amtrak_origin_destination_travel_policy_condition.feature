# Test Name: 80392 Amtrak - Origin & Destination Travel Policy Condition
# Description: Admin-configurable Amtrak travel policy conditions for Origin and Destination locations
# Status: Active
# ADO User Story: 79212
# Created: 2026-07-03

@regression @transportation @rails @amtrak @travel_policy
Feature: 80392 Amtrak - Origin and Destination Travel Policy Condition
  As an admin
  I want to configure Amtrak travel policy conditions based on Origin and Destination
  So that travelers are guided or restricted based on company route policies

  @priority:critical
  Scenario: One-way search matching the configured Origin condition triggers the out-of-policy indicator
    Given I am logged in as "automation@amtrak.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "nypToWas"
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Origin is New York, Ny - Moynihan Train Hall (nyp) and Destination is Washington, Dc - Union Station (was)"

  @priority:high
  Scenario: Round trip search evaluates the Origin condition per leg
    Given I am logged in as "automation@amtrak.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "wasToNyp"
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Origin is not Washington, Dc - Union Station (was)"
    When I click select button in results
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results for the return leg should be "Origin is New York, Ny - Moynihan Train Hall (nyp) and Destination is Washington, Dc - Union Station (was)"

  @priority:high
  Scenario: Origin-flagged result can be added to trip and the indicator persists into cart
    Given I am logged in as "automation@amtrak.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "nypToWas"
    Then the out of policy indicator should be visible in results
    When I select and add one way journey to trip
    Then the out of policy indicator should be visible in cart
    And the out of policy violations in cart should include "Origin is New York, Ny - Moynihan Train Hall (nyp) and Destination is Washington, Dc - Union Station (was)"

  @priority:medium
  Scenario: Search not matching the configured Origin condition shows no policy action
    Given I am logged in as "automation@amtrak.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "wasToBos"
    Then the out of policy indicator should not be visible in results
