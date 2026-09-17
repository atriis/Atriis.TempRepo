# Test Name: 34348 Top grid is displayed correctly
# Status: Active
# Labels: Regression,Flights
# Owner: Bruna Santos

@regression @flights @general
Feature: 34348 Top grid is displayed correctly
  As a corporate traveler
  I want every fare in the flight comparison table to stay inside its own box
  So that the carrier and stop-type a price belongs to is never ambiguous

  # The box behind each carrier/stop intersection is a fixed 75x48px `div.cell`
  # (flight-comparison.scss). A long amount or a multi-character currency prefix can overflow it
  # while the DOM stays valid, so this compares the rendered price rect against the box rect.
  # LON -> NYC is used because it returns a wide, fully-populated carrier matrix in USD.
  Scenario: Every comparison-table price is contained by its cell box
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "NYC"
    Then the comparison table should be visible in flight results and the toggle should display "Hide Comparison"
    And every price in the flight comparison table should fit inside its cell box
