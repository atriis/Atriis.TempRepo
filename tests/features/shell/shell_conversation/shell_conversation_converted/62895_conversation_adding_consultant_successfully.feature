# Test Name: 62895 Conversation - Adding consultant successfully
# Description:
# Status: Active
# Labels: trip conversation,Regression,Daily Shell,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-03T08:33:54Z
# Updated: 2025-07-01T08:14:20Z

@regression @shell @chat
Feature: 62895 Trip conversation - Adding consultant successfully
  As a corporate traveler
  I want to search for and add a consultant to my conversation
  So that the consultant appears in the recipients list of the conversation

  Scenario: Searching by name and adding a consultant to a conversation
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "GRU"
    And I wait for add to trip text to be visible
    And I open the chat
    And I start a new chat conversation
    # TODO: type "bruna" in the consultant search input field — Chat.searchConsultant
    When I search for consultant "bruna"
    # TODO: verify "Bruna" appears as the first result in the consultant dropdown — Chat.verifyConsultantInDropdown
    Then the consultant "Bruna" should appear in the search dropdown
    # TODO: click the first result to select the consultant — Chat.selectConsultantFromDropdown
    When I select the first consultant from the search dropdown
    # TODO: verify "Bruna" is now shown in the conversation recipients list — Chat.verifyConsultantInRecipients
    Then the consultant "Bruna" should be in the recipients list
