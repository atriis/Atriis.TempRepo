# Test Name: 34833 Sorting flight results from result comparison table is working as expected
# Description:
# Status: Active
# Labels: Regression,UI,Flights,results,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-23T09:48:33Z
# Updated: 2024-08-19T06:48:25Z

@regression @shell @flights @results @sorting
Feature: 34833 Flights - Sorting flight results from result comparison table is working as expected
  As a corporate traveler
  I want to sort flight results by clicking options in the comparison table
  So that the flight list reorders correctly to reflect the selected sort criterion

  Scenario: Sorting flight results via comparison table carrier and icon selections
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    And I fill in NL reference fields education and courses
    Then flight results should be available
    # loop() — clear all filters, select first airline in carriers filter, assert sort result
    # TODO: clear all applied filters — proposed: When I clear all flight result filters (FlightResults.clearAllFilters / FlightResultsPage click ".clear-all-btn")
    # TODO: select the first airline option from the carriers filter radio group — proposed: When I select the first airline from the carriers filter (FlightResults / FlightResultsPage click ".carriers-filter [role='group'] > :nth-child(1)")
    # TODO: verify the active sort option label in the comparison table radio button (html-attr-validation — manual step needed) — proposed: Then the active sort option in the comparison table should be "Price" (FlightResultsPage — read text of focused radio button inner span)
    # TODO: verify the first flight result price matches the price stored from the comparison table selection — proposed: Then the first flight result price should match the comparison table selection (FlightResults — compare first .flight-list .amount against stored price)
    # loop_on_icons() — clear all filters, click sort icon in comparison table, assert sort result
    # TODO: clear all applied filters — proposed: When I clear all flight result filters (FlightResults.clearAllFilters / FlightResultsPage click ".clear-all-btn")
    # TODO: click the sort icon button in the comparison table (aria-describedby="el-tooltip-164") — proposed: When I click the sort icon in the comparison table (FlightResultsPage — click sort icon by aria-describedby or data-testid)
    # TODO: verify the active sort option label in the comparison table radio button (html-attr-validation — manual step needed) — proposed: Then the active sort option in the comparison table should be updated (FlightResultsPage — read text of focused radio button inner span)
    # TODO: verify the first flight result price matches the price stored after sort icon selection — proposed: Then the first flight result price should match the comparison table selection (FlightResults — compare first .flight-list .amount against stored price)
