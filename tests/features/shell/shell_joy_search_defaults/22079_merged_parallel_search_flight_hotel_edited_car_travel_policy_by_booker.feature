# Test Name: 22079 MERGED Parallel search flight, hotel and edited Car + travel policy determined by the primary passenger (booker)
# Description:
# Status: Active
# Labels: Parallel,Flights,Hotel,No Amadeus Hotel Book,Cars,Regression,NL government,Travel policy,Search Flight,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-21T12:29:22Z
# Updated: 2026-01-18T08:19:22Z

@regression @shell @parallel-search @flights @hotels @cars @travel-policy
Feature: 22079 Shell - Parallel search flight, hotel and edited car with travel policy by booker
  As a corporate traveler (NL government) booking flight, hotel and car in parallel
  I want the travel policy to be determined by the primary passenger (booker)
  So that hotel and car options respect the booker's corporate travel policy

  Scenario: Parallel search flight, hotel and edited car applies the booker's travel policy
    Given I am logged in as "ronaldoassis@bookertravelpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight to "AMS" with a parallel hotel and an edited car in "MAD"
    And flight results should be available
    Then the flight origin should show "London (LON)"
    And the flight destination should show "Amsterdam  (AMS)"
    When I click edit search
    Then the flight depart and return dates should match the entered dates
    When I close the edit search drawer
    And I add the first result to trip
    Then the parallel hotel modal should contain "Amsterdam hotel"
    And I wait to see view rates text in results page
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the out of policy tooltip in results should be "Hotel cost per night is greater than or equals 70 EUR"
    And I add the first result to trip
    Then the parallel car modal should contain "Madrid car hire"
    And the parallel car location should be "Madrid,Spain,(MAD)"
    When I click edit search
    Then the car pick-up and drop-off dates should match the entered dates
