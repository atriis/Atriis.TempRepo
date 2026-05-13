# Test Name: 65020 Benerail > expiry - validate expired trip when counter is zero
# Description:
# Status: Active
# Labels: Rail,Expiry,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-08-01T12:45:30Z
# Updated: 2026-01-21T09:49:09Z
@wip @transportation @rails @benerail @regression
Feature: 65020 Benerail - Validate expired trip behaviour when expiry counter reaches zero
  As a corporate traveler
  I want to see the trip correctly marked as Expired when the quote timer runs out
  So that I know I need to search again for a new quote

  Scenario: Benerail trip is marked as Expired and search-again button appears after counter expires
    Given I am logged in as "pmac@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlabk"
    When I add a Benerail one way to the trip
    # TODO: create step "Then the Benerail expiry counter should be visible and show minutes remaining" in benerail_results.steps.js
    # covers: Hoover_and_validate_the_expire_counter() — hovers timer badge and validates tooltip shows time remaining
    Then the Benerail expiry counter should be visible and show minutes remaining
    # TODO: create step "When I navigate to a specific Benerail trip and verify it shows Expired status" in benerail_results.steps.js or trips.steps.js
    # covers: Navigate_to_specific_trip_and_check__Expired__status() — navigates to the trip URL and checks Expired label
    When I navigate to the Benerail trip and verify it shows Expired status
    # TODO: create step "Then the Delete button should be displayed and the Search again button should be clickable" in benerail_results.steps.js
    # covers: __Delete__button_is_displayed_and_click__Search_again_() — verifies Delete is visible and Search again works
    Then the Delete button should be displayed and Search again should be clickable
