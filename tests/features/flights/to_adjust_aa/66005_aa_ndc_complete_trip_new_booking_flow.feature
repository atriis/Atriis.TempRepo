# Test Name: 66005 AA NDC - Complete Trip - Corporate Role 'Use New Flight Booking Flow' added
# Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
# Check the role Booker for corporate AA NDC (Sonia Test) in TMC Frosch Sabre Demo.
# UPDATE: The privilege has a new name, now is "Use New Flight Booking Flow"
# Status: Active
# Labels: Regression,results,Role,Complete trip,AA NDC Regression,Pre Prod,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T06:21:29Z
# Updated: 2025-09-23T01:40:42Z

@to_adjust @flights @aa @ndc @role
Feature: 66005 AA NDC - Complete Trip - Corporate Role 'Use New Flight Booking Flow' added

  As a corporate traveler with the 'Use New Flight Booking Flow' privilege
  I want to book a round trip AA NDC flight
  So that I must go through pricing options to complete the booking for both outbound and inbound legs

  Scenario: Complete a round trip booking via pricing options with the 'Use New Flight Booking Flow' role
    Given I am logged in as "aandcuser" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ORD" to "LGA"
    # Assert 'Select flight' button is visible — 'Add to trip' and 'Pricing Options' are NOT shown directly
    # TODO: New step required. The Testim function checked isVisible('.flight-list > :nth-child(1) .btn--primary')
    # and had two negative element validations (no 'Add to trip', no 'Pricing Options' visible).
    # Proposed step: 'Then the first flight result should show "Select flight" and not pricing options'
    Then the first flight result should show "Select flight" and not pricing options
    # Click 'Select flight' for outbound → pricing options appear; select option → pricing options for inbound appear → select option → add to trip
    # TODO: New combined step (or individual steps) required. The Testim function Select_Flight_and_Verify_that_Pricing_Options_are_displayed did:
    #   1. Click '.flight-list > :nth-child(1) .btn--primary' (outbound 'Select flight')
    #   2. waitForText('#el-id-9612-305', 'Pricing Options') — outbound pricing options appear
    #   3. Click '.flicking-camera > :nth-child(1) .btn--primary' (select first outbound pricing option)
    #   4. waitForText('#el-id-8179-324', 'Pricing Options') — inbound pricing options appear
    #   5. Click '.select-btn' (select inbound option)
    #   6. Click '.add-btn' (add complete round trip to trip)
    # Proposed step: 'When I select outbound and inbound flights through pricing options'
    # Proposed DSL: FlightResults.selectRoundTripThroughPricingOptions(page)
    When I select outbound and inbound flights through pricing options
