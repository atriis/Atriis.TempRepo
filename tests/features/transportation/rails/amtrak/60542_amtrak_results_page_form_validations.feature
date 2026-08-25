# Test Name: 60542 Amtrak results page form validations
# Description: Amtrak results validations
# Status: Active
# Labels: search,Regression,Amtrak Sabre,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-04-03T11:58:22Z
# Updated: 2025-12-22T10:16:49Z
@transportation @rails @amtrak @regression
Feature: 60542 Amtrak - Results page form validations
  As a corporate traveler
  I want to validate the Amtrak results page interactions
  So that I can confirm fare rules, share, result details and add-to-trip flows work correctly

  Scenario: Amtrak results page - fare rules, share, details and add to trip
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    When I share the price offer from the Amtrak results page
    And I exit share mode
    When I view fare rules for the first Amtrak result
    Then the fare rules modal should show the supplier terms and conditions link
    When I close the Amtrak fare rules modal
    And I click more details for the first Amtrak result
    Then the available classes and fares should be displayed
    When I select the first Amtrak result from the more details drawer
    And I add an Amtrak one way to the trip
    Then the booking status should be "Pending booking"
