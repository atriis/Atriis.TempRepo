# Test Name: 82130 Hotel results are sorted by the default sort from administration
# Description: The corporate "TESTIM default hotel sort" (user dafna@pri.com) has a default hotel sort of Price configured in administration. Hotel search results must open already sorted by that default.
# Status: Design
# Labels: Hotel,Regression,Sort
# Owner: Shani Hadar

# ADO Test Case ID: 82130
@ado:82130
@regression @hotels
Feature: 82130 Hotels - Results sorted by the default sort (Price) from administration
  As a corporate traveler
  I want hotel results to use the default sort configured in administration
  So that the results are ordered the way my company expects

  @priority:medium
  Scenario: Hotel results use the corporate default sort (Price, lowest to highest)
    Given I am logged in as "dafna@pri.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    Then the sort filter has "Price" selected
    Then all hotels are sorted by price from lowest to highest
