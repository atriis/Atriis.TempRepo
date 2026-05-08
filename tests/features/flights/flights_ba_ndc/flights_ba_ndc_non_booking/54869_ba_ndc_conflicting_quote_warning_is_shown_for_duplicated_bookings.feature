# Test Name: 54869 BA NDC - Conflicting quote warning is shown for duplicated bookings
# Description:
# Status: Active
# Labels: BA NDC Regression,Flights,conflicting quote,warning,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-24T11:10:38Z
# Updated: 2025-06-17T03:45:14Z

@regression @flights @ndc @ba @conflicting-quote
Feature: 54869 BA NDC - Conflicting quote warning is shown for duplicated bookings

  As a corporate traveler
  I want to attempt to book the same BA NDC flight twice in the same trip
  So that I can verify a conflicting quotes warning is shown

  Scenario: Conflicting quote warning appears when adding a duplicate BA NDC flight
    Given I am logged in as "ian" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "DUB"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "DUB"
    Then the conflicting quotes dialog should be displayed after clicking add to cart
