# Test Name: 65398 Amadeus – Search by Schedule - Validate Inclusion of Both Segments in Round Trip with Same Low-Cost Carrier
# Status: Active
# Labels: Flights,by schedule,Amadeus,Regression,Ypsilon,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-01T11:29:01Z
# Updated: 2025-09-23T09:56:41Z

@regression @flights @general @by-schedule @amadeus @low-cost
Feature: 65398 Amadeus - Validate both segments included with same low-cost carrier
  As a corporate traveler
  I want both outbound and return segments included in a round trip by schedule
  So that the booking includes both legs when using the same low-cost carrier

  # TODO: New user needed — corporate.amadeus.lcc@soniatest.com → USER_CORPORATE_AMADEUS_LCC
  #   Add to .env, .env.example, and CI workflow secrets

  Scenario: Both segments are present when using same low-cost carrier (EasyJet)
    Given I am logged in as "corporate_amadeus_lcc" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "AMS" to "LON"
    # TODO: Step needed for "Select first segment filtered by carrier 'EasyJet' and second by 'EasyJet'"
    # Testim: Select_flights_by_carrier__by_schedule____Select_option('EasyJet', 'EasyJet')
    # TODO: Step needed for "Click proceed after search (click_on_procced_after_search)"
    # TODO: Step needed for "Add flights from pricing page — option with 'Not Separate Tickets'"
    # Testim: Add_flights_from_pricing_page_to_cart___Option_with_Not_Separate_Tickets()
    And I handle conflicting quotes if visible
    # TODO: Step needed for "Verify 'Pending booking' status is displayed"
    # TODO: Step needed for "Verify both outbound and return segments are present in the trip"
