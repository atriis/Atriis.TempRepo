# Test Name: hybrid_for_62913 Benerail Moove - Full name is correctly sent in the request when passenger full name has more than 15 characters
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation
# Owner: pini harush
# Created: 2025-01-01T00:00:00Z
# Updated: 2026-01-19T07:43:56Z
@wip @transportation @rails @benerail @regression
Feature: hybrid_for_62913 Benerail Moove - Full name is correctly sent when passenger full name has more than 15 characters
  As a QA engineer
  I want to perform a Benerail search with a guest whose full name exceeds 15 characters
  So that I can confirm the full name is correctly truncated or sent in the request without errors

  Scenario: Benerail search accepts guest with a full name longer than 15 characters
    Given I am logged in as "bruolisan" booking a new trip
    # TODO: create step "And I have added a random guest traveler with a name longer than 15 characters" in search.steps.js or common.steps.js
    # covers: Add_random_guest_16_characters() — adds a random guest traveler whose full name is exactly 16 characters
    And I have added a random guest traveler with a name longer than 15 characters
    When I search for a one way Benerail train from "bebmiToNlasc"
    # TODO: create step "Then the Benerail search results should be displayed" in benerail_results.steps.js
    # covers: wait_for_select_text() — waits for the results page to load and display the "Select" action,
    # confirming that a guest with a 16-char full name does not prevent the search from completing
    Then the Benerail search results should be displayed
