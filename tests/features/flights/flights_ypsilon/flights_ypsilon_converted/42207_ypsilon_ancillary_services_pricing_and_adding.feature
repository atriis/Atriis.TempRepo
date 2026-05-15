# Test Name: 42207 Ypsilon - Pricing are displayed when using ancillary services and adding ancillary successfully
# Description:
# Status: Active
# Labels: Regression,Ypsilon,baggage,ancillary,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-25T08:45:58Z
# Updated: 2025-02-05T08:18:46Z

@regression @flights @ypsilon @ancillary @baggage
Feature: 42207 Ypsilon - Ancillary services pricing displayed and adding ancillary successfully
  As a corporate traveler using Ypsilon
  I want to see pricing when using ancillary services and add them successfully
  So that I can purchase additional baggage for my flight

  Scenario: Add ancillary baggage service and verify pricing and success notification
    Given I am logged in as "ypsilon@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STN" to "EDI"
    And I filter results by carrier "U2"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the baggage extras section
    Then the baggage carrier should display "EasyJet"
    # TODO: Expand the first flight baggage dropdown, verify option text matches hold bag pattern, select the option
    # TODO: Verify the baggage price is displayed in GBP
    # TODO: Click Save button in ancillary services and verify "Success" notification
    # TODO: Verify the ancillary services section shows "filled" indicator after saving
