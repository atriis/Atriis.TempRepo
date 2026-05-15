# Test Name: 57430 [Merge] Ypsilon - Aer Lingus - Baggages are displayed correctly in "Ancillary Services" and are being saved
# Description:
# Status: Active
# Labels: Ypsilon,Regression,Flights,baggage,ancillary,merge,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-30T07:24:17Z
# Updated: 2025-02-17T05:59:16Z

@regression @flights @ypsilon @ancillary @baggage @aer-lingus @priority:high @provider:ypsilon
Feature: 57430 Ypsilon - Aer Lingus baggages displayed correctly in ancillary services and saved
  As a corporate traveler using Ypsilon
  I want to see Aer Lingus baggage options displayed correctly in ancillary services
  So that I can select and save baggage for my flights

  Scenario: Aer Lingus baggage options display correctly and save successfully
    Given I am logged in as "ypsilon@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "DUB"
    And I filter results by carrier "EI"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the ancillary services section
    Then the ancillary services carrier should display "Aer Lingus"
    When I select the first ancillary service option with price for flight 1 and store its value
    And I select the first ancillary service option with price for flight 2 and store its value
    And I click the save button
    Then the ancillary services green checkmark should be visible
    And the booking status should be "Pending booking"
    When I click to edit the ancillary services section
    Then the saved ancillary services selections should be retained

