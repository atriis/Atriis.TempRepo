# Test Name: 22074 MERGED MERGED travel policy determined by the primary passenger (2 users, second is the primary) + reference and dynamic on search are taken from the primary traveler (user group different from the booker)
# Status: Active
# Labels: Regression,Hotel,NL government,Travel policy,performance,No Amadeus Hotel Book,OOP,Dynamic fields,Reference Fields,Corp RF,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-13T05:48:23Z
# Updated: 2026-02-16T12:55:41Z

@regression @provider:general
Feature: 22074 Reference and dynamic fields and travel policy are taken from the primary traveler, case with corporate user 
  As a corporate user that add corporate traveler from different user group
  I want to see the reference fields according to the primary traveler administration
  I want to see the dynamic fields according to the primary traveler administration
  I want to see the travel policy according to the primary traveler administration

  @priority:high
  Scenario: Reference, dynamic and travel policy are taken from the primary traveler, case with corporate user
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "olga cohen"
    And I have added "gadi cohen" as primary traveler
    When I initiate a hotel search in "London" for 1 night
    Then the reference fields popup should show the following labels:
      | Type of Trip             |
      | Location travel policy   |
      | Personnel number         |
    Then the reference fields should have the following values:
      | field                    | value              |
      | Type of Trip             | Select             |
      | Type of traveller        | External employee  |
      | Location travel policy   | Netherlands        |
    Then the following reference fields should not be editable:
      | Type of traveller        |
      | Personnel number         |
    Then clicking proceed should show a mandatory field validation error
    And I fill in NL reference fields education and courses
    And I wait for hotel results to load
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the out of policy indicator should be visible in results
    Then the out of policy tooltip in results should be "Hotel cost per night is greater than or equals 50 EUR"
