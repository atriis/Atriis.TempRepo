# Test Name: 79773 Amadeus - Cancel and change info displayed for PFA fare
# Description: Amadeus PFA fare - verify change and cancellation info is visible in fare rules from pricing options
# Status: Active
# Labels: Amadeus,Flights,Fare Rules,PFA,Non-Booking

# ADO Test Case ID: 79773
@ado:79773
@regression @flights @amadeus @fare-rules @pfa
Feature: 79773 Amadeus - Cancel and change info displayed for PFA fare
  As a corporate traveler
  I want to see change and cancellation info in fare rules when selecting a PFA fare
  So that I can make an informed booking decision

  Scenario: Fare rules change and cancel info displayed for PFA fare in pricing options
    Given I am logged in as "pfaFare@corp.uni" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BRU" to "DXB"
    And I filter results by carrier "Emirates"
    And I click to open first pricing options
    When I click fare rules for the first PFA fare
    Then change and cancel info is displayed















