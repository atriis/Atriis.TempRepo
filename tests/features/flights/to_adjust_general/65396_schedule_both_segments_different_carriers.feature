# Test Name: 65396 Amadeus – Validate Inclusion of Both Segments in Round Trip Using Different Non-Low-Cost Carriers
# Status: Active
# Labels: Flights,by schedule,Amadeus,Regression,Low cost,Ypsilon,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-02T09:38:40Z
# Updated: 2025-09-23T12:52:40Z

@regression @flights @general @by-schedule @amadeus @low-cost
Feature: 65396 Amadeus - Validate both segments included with different non-low-cost carriers
  As a corporate traveler
  I want both outbound and return segments included in a round trip by schedule
  So that the booking includes the correct carriers for each leg

  # TODO: New user needed — corporate.amadeus.lcc@soniatest.com → USER_CORPORATE_AMADEUS_LCC
  #   Add to .env, .env.example, and CI workflow secrets

  Scenario: Both segments are present when using different non-low-cost carriers (LH, LX)
    Given I am logged in as "corporate_amadeus_lcc" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LIS" to "BCN"
    # TODO: Step needed for "Select first segment filtered by carrier 'LH' and second segment by carrier 'LX'"
    # Testim: Select_flights_by_carrier__by_schedule_('LH', 'LX')
    And I add "Your Selection" fare to trip
    And I handle conflicting quotes if visible
    # TODO: Step needed for "Verify 'Pending booking' status is displayed"
    # TODO: Step needed for "Verify both outbound and return segments show 'BCN' as destination"
