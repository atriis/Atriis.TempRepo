# Test Name: 55728 Split ticket - checkbox enhancements
# Description: verify Split ticket - checkbox is out side the advents form
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-12-26T12:53:23Z
# Updated: 2025-09-14T09:43:16Z
@transportation @rails @evolvi @regression
Feature: 55728 Split ticket - checkbox enhancements
  As a UK Rail booker
  I want the Request Split Ticket option to sit in the main UK Rail search form
  So that I can request a split ticket without opening the advanced search section

  Scenario: Request Split Ticket is offered outside advanced search and pre-checked
    Given I am logged in as "eve@levi.com" booking a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    And I fill in a round trip Evolvi train from "oxfToWin" without clicking search button
    Then the "Request Split Ticket" checkbox should be displayed and checked
    And I click the UK Rail search button
    And I acknowledge the push notification
    Then I should see outbound text in Evolvi results page
