# Test Name: 61685 Traveller should drive the associated consultant
# Description:
# Status: Active
# Labels: Regression,trip conversation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-24T04:55:18Z
# Updated: 2025-07-24T05:04:58Z

@regression @shell @chat
Feature: 61685 Trip conversation - Traveller should drive the associated consultant
  As a corporate traveler
  I want the system to automatically associate my assigned consultant
  So that the correct consultant appears pre-filled when I open a chat conversation

  Scenario: Opening a new conversation shows the consultant associated with the traveler
    Given I am logged in as "CELINE@A.COM" booking a new trip
    And I have added traveler by name "Emma"
    When I search for a one way flight from "LON" to "PAR"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open the chat
    And I start a new chat conversation
    And I add an agent to the chat
    # TODO: verify the consultant pre-filled for the traveler is "Guy Shok Consultant" — Chat.verifyConsultantName
    Then the associated consultant should be "Guy Shok Consultant"
