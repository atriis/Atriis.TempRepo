# Test Name: 28647 MERGED Amadeus flight Booking for 2 ADTs + banner for rail after searching a flight
# Description: HYBRID for 30912 If paid by corporate, no need to show the client card name
# Status: Active
# Labels: Regression,Flights,Amadeus,No Amadeus Hotel Book,Adding Passengers,Full Purchase,Search Flight,Cancel by process,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-08T01:33:26Z
# Updated: 2026-01-19T01:31:38Z

@regression @flights @amadeus @multi-pax @full-purchase
Feature: 28647 Amadeus - Multi-pax booking with rail banner
  As a corporate traveler
  I want to book a flight for 2 passengers and see rail banner
  So that I can consider greener transport options and book for multiple travelers

  Scenario: Book round trip for 2 ADTs and verify rail banner is displayed
    Given I am logged in as "amos" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "pit rip"
    When I search for a round trip flight from "AMS" to "BRU"
    And I click proceed on the reference fields popup
    # TODO: Validate rail banner is displayed in results
    # Testim: verifies "Best" tab active, "Rail" available message,
    # "Lower CO2 emission" text, and "Rail options" button
    # Need new step: Then the rail banner should be visible in results
    # DSL: FlightResults.validateRailBanner(page) → FlightResultsPage selectors
    And I add the first flight to cart
    And I proceed to checkout
    And I complete the booking
    # TODO: Verify "Flight details" text is visible in trip overview
    # Testim: waitForText(page, ".more-details-btn", 'Flight details')
    # TODO: Verify passenger initials are displayed
    # Testim: verifies "AO" and "PR" initials for the two passengers
    # Need new step: Then the passenger initials "AO" should be visible
    # And the passenger initials "PR" should be visible
