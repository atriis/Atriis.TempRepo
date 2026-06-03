# Test Name: 33070 Chat works properly
# Description:
# Status: Active
# Labels: Chat,Regression,No Amadeus Hotel Book,never failed,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-07T11:40:45Z
# Updated: 2023-07-07T11:58:45Z

@regression @shell @chat
Feature: 33070 Chat - Chat works properly
  As a corporate traveler
  I want to start a chat conversation with an agent and send a message
  So that the chat feature works properly during a booking

  Scenario: Sending a message to an agent shows the message in the chat
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LHR" to "FRA"
    And I open the chat
    And I start a new chat conversation
    And I add an agent to the chat
    And I type "bbbbbbbbbb bbbbbbbbbb" in the chat message field
    And I send the chat message
    Then the chat conversation should display the message "bbbbbbbbbb bbbbbbbbbb"
