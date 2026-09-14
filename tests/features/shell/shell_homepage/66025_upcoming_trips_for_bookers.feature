# Test Name: 66025 Upcoming trips for bookers
# Description:
# Status: Active
# Labels: Regression,Trip monitor,Trips,Booker,Homepage,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-12T02:28:54Z
# Updated: 2025-09-12T02:44:13Z

@regression @shell @homepage
Feature: 66025 - Upcoming trips for bookers
  As a booker
  I want to view all trips and the "My trips only" filter on the upcoming trips panel
  So that I can monitor the trips I book on behalf of others

  # Trip 3549129 is a past trip booked for another traveller, so it proves the filter
  # narrows the list rather than just flipping: it is listed while the switch is off
  # and gone once it is on.
  Scenario: Viewing all trips and the "My trips only" filter as a booker
    Given I am logged in as "we@s.com"
    When I click the all trips button on the homepage
    Then the "My trips only" filter switch should be visible on the trips page
    And the "My trips only" filter switch should be toggled off
    When I select the "Past trips" quick view on the trips page
    Then the trip with id "3549129" should be listed on the trips page
    When I turn the "My trips only" filter switch on
    Then the trip with id "3549129" should not be listed on the trips page
