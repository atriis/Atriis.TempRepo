# Test Name: 47093 Trip conversation - HTML is not being displayed
# Description:
# Status: Active
# Labels: Regression,UI,trip conversation,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-06T11:45:33Z
# Updated: 2026-01-12T08:06:58Z

@regression @shell @chat
Feature: 47093 Trip conversation - HTML is not being displayed
  As a corporate traveler
  I want to send a message with HTML content in the chat
  So that HTML tags are rendered as plain text and not as raw markup in the conversation

  Scenario: HTML tags in a chat message are displayed as plain text
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "TLV"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open the chat
    And I start a new chat conversation
    And I add an agent to the chat
    # TODO: select the traveler from the conversation traveler dropdown — Chat.selectTravelerInConversation
    And I select the traveler in the conversation form
    And I type "testim <br /> testim <br /> testim" in the chat message field
    And I send the chat message
    Then the chat conversation should display the message "testim  testim  testim"
    # TODO: navigate back from the chat panel to the trip — Chat.navigateBackFromChat
    When I navigate back from the chat to the trip
    # TODO: verify the last message shown in the trip conversation list — Chat.verifyLastMessageInTrip
    Then the last message in the trip should be "testim  testim  testim"
    Then I successfully cancel the trip
