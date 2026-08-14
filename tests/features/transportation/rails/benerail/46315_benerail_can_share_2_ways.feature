# Test Name: 46315 benerail - can share 2 ways
# Description:
# Status: Active
# Labels: Regression,share quote,results,Bene seats,Daily Transportation,Benerail Moove Regression,Transportation,2026 plan 1,02
# Owner: pini harush
# Created: 2024-05-23T06:03:41Z
# Updated: 2025-09-19T11:16:50Z
@transportation @rails @benerail @regression
Feature: 46315 Benerail - Can share price offer after selecting 2 ways in results
  As a corporate traveler
  I want to share the Benerail price offer after selecting both outbound and return journeys
  So that stakeholders can review both legs before booking

  Scenario: Benerail price offer shared after selecting both journey legs from results
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    And I wait for select text to be visible
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I wait to see change button
    And I click on the 2 share button in results page
    And I click on the "Share" button to open the share dialog
    Then I wait to see "Subject" field in share dialog
    And I send the share and see success notification
