# Test Name: 79898 Flights - Sabre carrier filter results display
# Status: Draft
# Labels: Regression,Flights,Sabre,results

# ADO Test Case ID: 80849
@regression @flights @sabre @ado:79898 @ado:80849
Feature: 80849 Flights - Sabre - Display AccesRail results
  As a corporate traveler
  I want to filter Sabre round trip results by carrier
  So that I see only the results for the selected carrier

  Scenario: Sabre round trip results filtered by carrier show matching carrier results
    Given I am logged in as "priceNot0@corp.frosch" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MCO" to "MIA" with outbound in 14 days and return in 17 days
    And I select the "Accesrail" carrier logo from the comparison table
    Then all flight results should be from airline "Accesrail"
    And I select the "American Airlines" carrier logo from the comparison table
    Then all flight results should be from airline "American Airlines"
