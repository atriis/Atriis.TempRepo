# Test Name: 80165 Flights - Sabre NDC Qantas Agreement fares displayed in results and pricing options
# Status: Draft
# Labels: Regression,Flights,Sabre,results,Pricing Options

# ADO Test Case ID: 80956
# ADO workitem: 80165
@regression @flights @sabre @ado:80165 @ado:80956
Feature: 80956 Flights - Sabre NDC Qantas Agreement fares displayed in results and pricing options
  As a corporate traveler
  I want NDC Qantas agreement fares to be requested and displayed with the ABN Agreement indicator in results and pricing options
  So that the agreement indicator confirms we are sending the correct request format to retrieve agreement fares

  Scenario: Sabre QF ABN Agreement indicator is visible in results and pricing options
    Given I am logged in as "QFpax2@sabre.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "SYD" to "LON"
    Then flight results should be available
    And I filter results by carrier "QF"
    Then the "Agreement" indicator should be visible in results
    When I click to open first pricing options
    Then the "Agreement" indicator should be visible in pricing options
