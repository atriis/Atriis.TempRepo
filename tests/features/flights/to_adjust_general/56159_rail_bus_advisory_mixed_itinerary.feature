# Test Name: 56159 - Rail / Bus advisory for mixed transportation itinerary, equipment in detailed offer email
# Status: Active
# Labels: NL government,results,Advisory,price offer,Flights,Amadeus,Regression,2026 plan 1
# Owner: Noam Miller
# Created: 2025-01-02T05:39:45Z
# Updated: 2025-02-04T11:49:28Z

@regression @flights @general @advisory
Feature: 56159 Flights - Rail Bus advisory for mixed transportation itinerary
  As a corporate traveler
  I want to see rail/bus advisory for mixed transportation itineraries
  So that I am aware of non-flight segments in my journey

  # TODO: New user needed — copytrip@corp.com → USER_COPYTRIP
  # Add to .env: USER_COPYTRIP="copytrip@corp.com"

  Scenario: Rail bus advisory is displayed in results and offer email for mixed itinerary
    Given I am logged in as "copytrip" booking a new trip
    And I have added a random guest traveler
    # TODO: Step needed for "Check 'Allow nearby airports' checkbox"
    When I search for a round trip flight from "BUD" to "QKL"
    # TODO: Step needed for "Verify rail/bus advisory is displayed in results"
    # TODO: Step needed for "Verify equipment type is listed in detailed offer email"
    # TODO: Step needed for "Verify rail/bus advisory in cart flight details"
    # TODO: Step needed for "Verify equipment is listed in offer email from cart"
