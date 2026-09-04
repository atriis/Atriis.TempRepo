# Test Name: 47291 BA NDC - DOB is mandatory in APIS when traveler does not have DOB configured
# Description:
# Status: Active
# Labels: BA NDC Regression,APIS,Flights,Cart,DOB,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-17T09:58:07Z
# Updated: 2025-09-14T09:18:51Z

@regression @flights @ndc @ba @apis @dob
Feature: 47291 BA NDC - DOB is mandatory in APIS when traveler has no DOB configured

  As a corporate traveler
  I want to book a BA NDC flight to the US as a traveler without a DOB configured
  So that I can verify DOB is mandatory in the APIS section

  Scenario: DOB is required in APIS for traveler without configured DOB
    Given I am logged in as "chris@ndcba.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "NYC"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the passenger info section should be marked as required with an asterisk
    When I click passenger info in extras
    Then the date of birth field should be required in the passenger info section
    When I fill in the passenger info date of birth
    And I click the save button
    Then mandatory fields should be highlighted in the passenger info section
