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

  Scenario: Viewing all trips and the "My trips only" filter as a booker
    Given I am logged in as "we@s.com"
    # TODO: implement 'I click the all trips button on the upcoming trips panel' — click the "All trips" button inside the upcoming-trips pane
    When I click the all trips button on the upcoming trips panel
    Then the "My trips only" filter checkbox should be visible on the trips page
    # TODO: implement 'the {string} filter should be checked on the trips page' — assert the named filter checkbox is checked (source Testim left the assertion unimplemented)
    And the "My trips only" filter should be checked on the trips page
