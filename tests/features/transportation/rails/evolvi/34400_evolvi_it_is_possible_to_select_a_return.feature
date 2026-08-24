# Test Name: 34400 Evolvi - It is possible to select a return
# Description:
# Status: Active
# Labels: Regression,results,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-06-05T11:48:31Z
# Updated: 2025-06-08T12:33:34Z
@transportation @rails @evolvi @regression
Feature: 34400 Evolvi - It is possible to select a return
  As a corporate traveler
  I want to select outbound and inbound Evolvi fares
  So that the inbound selection reflects the expected return leg information

  Scenario: Select outbound fare and validate inbound selection information
    Given I am logged in as "eve@levi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "oxfToWin"
    And I acknowledge the push notification
    When I extract the first outbound departure hour available
    And I select the outbound first price available
    Then outbound is displayed on top of the page with the same extracted outbound departure hour
    When I extract the first inbound departure hour available
    And I select the inbound first price available
    Then inbound is displayed on top of the page with the same extracted inbound departure hour

