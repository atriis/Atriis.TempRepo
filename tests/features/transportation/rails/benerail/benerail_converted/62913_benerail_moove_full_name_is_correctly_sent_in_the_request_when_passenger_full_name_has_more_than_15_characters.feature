# Test Name: hybrid_for_62913 Benerail Moove - Full name is correctly sent in the request when passenger full name has more than 15 characters
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation
# Owner: pini harush
# Created: 2025-01-01T00:00:00Z
# Updated: 2026-01-19T07:43:56Z
@wip @transportation @rails @benerail @regression
Feature: Benerail Moove - Full name is correctly sent when passenger full name has more than 15 characters
  As a QA engineer
  I want to perform a Benerail search with a guest whose full name exceeds 15 characters
  So that I can confirm the full name is correctly truncated or sent in the request without errors

  Scenario: Benerail search accepts guest with a full name longer than 15 characters
    Given I am logged in as "bruolisan@benerailmoovecorp.com" booking a new trip
    And I have added a random guest traveler with name "VAN" "STEENBRUGGHEKYO "
    When I search for a one way Benerail train from "bebmiToNlasc"
    And I wait for select text to be visible
    When I capture the "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" from Storage
    Then the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "VAN".onKey("firstName")
    And the captured "request" payload for request type "addPassenger -dialogue-engine/dialogues/passengers POST" should contain "STEENBRUGGHEKYO".onKey("lastName")