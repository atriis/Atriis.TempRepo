# Test Name: 61091 Ypsilon - Multi pax, Ancillary service selection saved for all
# Description:
# Status: Active
# Labels: Ypsilon,Regression,Amsalem,baggage,ancillary,Flights,Daily Flights,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-21T08:04:46Z
# Updated: 2025-11-18T07:55:56Z

@regression @flights @ypsilon @ancillary @baggage @multi-pax
Feature: 61091 Ypsilon - Multi pax ancillary service selection saved for all travelers
  As a corporate traveler using Ypsilon with multiple passengers
  I want ancillary service selections to be saved for all travelers
  So that baggage options are correctly retained after saving

  Scenario: Baggage selections saved for both travelers after adding ancillary services
    Given I am logged in as "ypsilon@corp.ams" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "AMS"
    Then flight results should be available
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    # Add baggage for both travelers
    When I click to edit the baggage extras section
    # TODO: For traveler 1 - select baggage options for outbound and inbound flights
    # TODO: For traveler 2 - switch to second traveler tab, select baggage options for outbound and inbound flights
    # TODO: Click Save button in ancillary services and verify success notification
    # TODO: Refresh cart page
    # Validate baggage selections were saved for all travelers
    # TODO: Reopen ancillary services and verify saved selections match for traveler 1 (outbound and inbound)
    # TODO: Switch to traveler 2 tab and verify saved selections match (outbound and inbound)
