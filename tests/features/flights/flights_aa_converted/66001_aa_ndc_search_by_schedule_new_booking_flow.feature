# Test Name: 66001 AA NDC - Search By Schedule - Corporate Role 'Use New Flight Booking Flow' added
# Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
# Check the role Booker for corporate AA NDC (Sonia Test) in TMC Frosch Sabre Demo.
# UPDATE: The privilege has a new name, now is "Use New Flight Booking Flow"
# Status: Active
# Labels: Regression,results,Role,AA NDC Regression,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T04:43:42Z
# Updated: 2025-09-23T01:36:13Z

@to_adjust @flights @aa @ndc @role @schedule
Feature: 66001 AA NDC - Search By Schedule - Corporate Role 'Use New Flight Booking Flow' added

  As a corporate traveler with the 'Use New Flight Booking Flow' privilege
  I want to search for a flight by schedule
  So that pricing options are shown when I click 'Select flight' instead of adding directly to my trip

  Scenario: Results show 'Select flight' button and open pricing options on click
    Given I am logged in as "aandcuser" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ORD" to "LGA"
    # Outbound — assert 'Select flight' is visible and 'Pricing Options' is NOT yet shown
    # TODO: New step required to assert the first result button text is "Select flight"
    # and that no 'Pricing Options' control is visible in the results at this point.
    # The Testim function checked isVisible('.flight-list > :nth-child(1) .btn--primary')
    # and waitForText('.btn--primary', 'Select flight'), plus a negative element validation.
    # Proposed step: 'Then the first flight result should show "Select flight" and not pricing options'
    Then the first flight result should show "Select flight" and not pricing options
    # Outbound — click 'Select flight' and verify pricing options modal appears
    # TODO: New step required. The Testim function clicked '.flight-list > :nth-child(1) .btn--primary'
    # (the 'Select flight' button) and waited for '#el-id-9612-305' to contain 'Pricing Options'.
    # The existing step 'When I click to open first pricing options' targets '.btn.pricing-options'
    # which is NOT the 'Select flight' button — a new step is needed.
    # Proposed step: 'When I click "Select flight" to open pricing options'
    # Proposed DSL: FlightResults.clickSelectFlightToOpenPricingOptions(page)
    When I click "Select flight" to open pricing options
    # Outbound — select first pricing option and add to trip
    And I select the first option from pricing options
    And I add to trip from pricing options
    # Inbound — assert 'Select flight' is visible and 'Pricing Options' is NOT yet shown
    # TODO: Same new step as above but for the inbound segment results.
    Then the first flight result should show "Select flight" and not pricing options
    # Inbound — click 'Select flight' and verify pricing options modal appears
    When I click "Select flight" to open pricing options
    # Inbound — select first pricing option and add to trip
    And I select the first option from pricing options
    And I add to trip from pricing options
