# Test Name: 66003 IB NDC - Search By Schedule - Corporate Role 'Use New Flight Booking Flow' added
# Description: The privilege 'Use New Flight Booking Flow' (formerly 'Must Use Flights Pricing Options') must be assigned
#              to the Booker role for IB NDC corporate (Sonia Test) in TMC Amsalem.
# Status: Active
# Labels: Regression,results,Role,NDC,Complete trip,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T05:32:39Z
# Updated: 2025-09-23T01:59:43Z

@regression @flights @iberia @ndc @role
Feature: 66003 IB NDC - Round trip with 'Use New Flight Booking Flow' role
  As a corporate traveler with the 'Use New Flight Booking Flow' privilege
  I want pricing options to drive the round trip booking flow
  So that the Select Flight button leads me through pricing options for the inbound leg

  #BLOCKED - no results, could not test the entire scenario 
  Scenario: Round trip search shows Select Flight on outbound and pricing options on inbound
    Given I am logged in as "ibndc_soniatest" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "BCN"
    And flight results should be available
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select one flight segment by schedule
    Then I should see the heading "Pricing Options"
    When I select the first option from pricing options
    Then I should see the heading "Pricing Options"
    When I add to trip from pricing options
