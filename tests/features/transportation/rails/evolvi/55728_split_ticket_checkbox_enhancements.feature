# Test Name: 55728 Split ticket - checkbox enhancements
# Description: verify Split ticket - checkbox is out side the advents form
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-12-26T12:53:23Z
# Updated: 2025-09-14T09:43:16Z
@wip @transportation @rails @evolvi @regression
Feature: 55728 Split ticket - checkbox enhancements
  As a UK Rail booker
  I want the Request Split Ticket option to sit in the main UK Rail search form
  So that I can request a split ticket without opening the advanced search section

  Scenario: Request Split Ticket is offered outside advanced search and pre-checked
    Given I am logged in as "eve@levi.com" booking a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    # TODO: create step "And I fill in a round trip Evolvi train from {string} without clicking search button" in evolvi_search.steps.js
    # covers: select the Return trip type, fill origin and destination from the route key, pick the departure and return dates, leave the split ticket checkbox at its default and do not submit — Copy_of_UK_Rail__Evolvi__rountrip_search()
    And I fill in a round trip Evolvi train from "oxfToWin" without clicking search button
    # TODO: create step "Then the {string} checkbox should be displayed outside the advanced search section" in evolvi_search.steps.js
    # covers: the named checkbox renders in the main UK Rail search form, not inside the collapsed advanced search section — Copy_of_UK_Rail__Evolvi__rountrip_search()
    Then the "Request Split Ticket" checkbox should be displayed outside the advanced search section
    And I validate that split ticket options in Evolvi search checkbox is checked
    When I click the search button
