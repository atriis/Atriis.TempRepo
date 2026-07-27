# Test Name: 58613 gemini chat in the new ui
# Description:
# Status: Active
# Labels: Regression,2026 plan 2
# Owner: Yael
# Created: 2025-08-17T09:35:49Z
# Updated: 2025-08-27T07:40:45Z

@regression @shell @chat
Feature: 58613 Chat - Gemini chat in the new UI
  As a corporate traveler
  I want to open the agent chat, send a message and end the conversation
  So that the agent chat widget works properly in the new UI

  Scenario: Sending a message in the agent chat and ending the conversation
    Given I am logged in as "Gemini@test.com" booking a new trip
    And I have added myself as the traveler
    When I open the agent chat
    And I type "HELLO" in the agent chat message field
    And I send the agent chat message
    Then the agent chat should display the message "HELLO"
    When I close the agent chat
    And I confirm ending the agent chat
    Then the agent chat should be closed
