# Test Name: 85770 Amadeus NDC - by schedule Premium Economy out / Business back offers a Business return
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,New Flight Flow,by schedule,Mixed cabin
# Owner: Yael Alef
# Created: 2026-10-01

# ADO Test Case ID: 85770
# Source: ADO Bug #85294 - [Flights][Amadeus] By-schedule mixed-cabin search: Business return priced
#         only in Premium Economy
#
# A by-schedule round trip searched in a different cabin per leg. The return opens with a short
# regional flight, so the pricing page used to price the whole return in the first flight's cabin
# and the Business the traveller searched disappeared. The pricing page must keep a Business tab on
# the return. A US domestic feeder sells its front cabin as "First", so the return tab may read
# "First" (e.g. Delta LIT-ATL-FRA) - either Business or First passes; Premium only fails.
# The searchedCabins ["W","C"] request field is a manual F12 check: the FlightPricingV3 API log
# reaches Storage too late for a reliable payload step.

@ado:85770 @regression @flights @amadeus @ndc @by-schedule @new-flight-flow @mixed-cabin
Feature: 85770 Amadeus NDC - by schedule mixed cabin keeps the searched Business return
  As a corporate traveler
  I want the return I searched in Business to be offered in Business on the pricing page
  So that a Premium Economy out / Business back trip is not repriced as Premium Economy both ways

  Scenario: Premium Economy out, Business back - the return offers a Business cabin tab
    Given I am logged in as "amsnewflowama@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight by schedule from "FRA" to "LIT" with outbound cabin "Premium Economy" and return cabin "Business"
    # One carrier on both legs, so the two selections always price together.
    And I filter results by carrier "Delta"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    Then "LIT-FRA" leg should have results available
    When I filter results by carrier "Delta"
    And I select one flight segment by schedule
    And I select the outbound first option from pricing options new flight flow
    Then the inbound leg should offer one of the "Business, First" cabin class tabs in flight selection
