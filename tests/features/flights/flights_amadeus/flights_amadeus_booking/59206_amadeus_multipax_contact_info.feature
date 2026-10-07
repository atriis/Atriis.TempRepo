# Test Name: Hybrid for 59206: Amadeus (OBT) - Flights - Multi pax booking succeeds, contact info association per pax
# Description: Book an Amadeus flight for three travellers with contact sharing allowed. The contact
# PNR_AddMultiElements must carry one CTCE and one CTCM per traveller - each attached to that
# traveller through referenceForDataElement, and never repeated for anyone.
# Status: Active
# Labels: Amadeus,Flights,Full Purchase,Regression,multi pax,GDS,progress page,Cancel by process,Club,contact info,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-11T07:19:01Z
# Updated: 2026-01-26T03:34:41Z

# ADO Test Case ID: 59206
@ado:59206 @regression @flights @amadeus @multi-pax @contact-info @full-purchase @payload
Feature: 59206 Amadeus - Multi-pax booking with contact info per pax
  As a corporate traveler
  I want contact info to be associated per passenger in a multi-pax booking
  So that each traveler gets the correct contact details

  Scenario: Book flight for 3 guests and send CTCE and CTCM once per traveller
    Given I am logged in as "multipax@ama.club" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "SIN" to "FRA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I uncheck contact sharing and edit the phone to "1 505 1001000"
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And every one of the 3 passengers in the "Amadeus4.PNR_AddMultiElements" requests should carry each of "CTCE,CTCM" exactly once
    And I attempt to cancel the trip safely
