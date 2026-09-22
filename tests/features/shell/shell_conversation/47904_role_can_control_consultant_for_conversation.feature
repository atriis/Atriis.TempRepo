# Test Name: 47904 role can control consultant for conversation
# Description:
# Status: Active
# Labels: Regression,Role,Privileges,trip conversation,Daily Shell,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-07-07T11:28:23Z
# Updated: 2026-01-26T03:20:08Z

@regression @shell @chat
Feature: 47904 Trip conversation - Role can control consultant for conversation
  As a corporate consultant with a specific role
  I want the role configuration to govern consultant visibility in conversations
  So that traveler-consultant associations are correctly controlled by permissions

  Scenario: Role allows consultant to view the traveler name in the chat panel
    Given I am logged in as "gadi@Testimcorpnl.com" booking a new trip
    And I have added traveler by name "mali cohen"
    When I initiate a hotel search in "MAD" for 1 night
    And I click proceed button if visible
    And I wait to see view rates text in results page
    And I open the chat
    And I start a new chat conversation
    And I add an agent to the chat
    Then the associated consultant should be "Shani Nl Consultant"
