# Test Name: 61686 Evolvi> expiry - validate expired trip when counter is zero
# Description: validate expired trip when counter is zero
# Status: Active
# Labels: Regression,Rail,Evolvi,Expiry,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-06T04:44:14Z
# Updated: 2025-09-12T10:17:28Z
@transportation @rails @evolvi @regression @wip
Feature: 61686 Evolvi - Expiry validate expired trip when counter is zero
  As a corporate traveler
  I want an Evolvi rail quote whose booking counter has run down to zero to be marked as expired
  So that I can only remove the quote or start a new search instead of booking it

  Scenario: Expired Evolvi trip shows the Expired status and the search again action
    Given I am logged in as "corp@Evolvi.com"
    When I navigate to trip 3487993
    # TODO: read the actual text of the Evolvi quote status/countdown area and assert it reads "Expired" - the live countdown and the expired state share the same container, so a presence-only check still passes after expiry
    Then the trip quote status text should be "Expired"
    And the Delete button should be displayed and the Search again button should be clickable
