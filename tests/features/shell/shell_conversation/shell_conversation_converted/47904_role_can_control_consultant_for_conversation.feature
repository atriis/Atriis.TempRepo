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
    When I search for a hotel in "MAD" for 1 night(s)
    And I click proceed after search
    And I open the chat
    And I start a new chat conversation
    And I add an agent to the chat
    # TODO: verify the traveler name is visible and accessible in the consultant panel — Chat.verifyTravelerNameInConsultantPanel
    Then the traveler name should be visible in the consultant panel
