# Test Name: 22079 MERGED Parallel search flight, hotel and edited Car + travel policy determined by the primary passenger (booker)
# Description:
# Status: Active
# Labels: Parallel,Flights,Hotel,No Amadeus Hotel Book,Cars,Regression,NL government,Travel policy,Search Flight,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-21T12:29:22Z
# Updated: 2026-01-18T08:19:22Z

@regression @shell @parallel-search @flights @hotels @cars @travel-policy
Feature: 22079 Shell - Parallel search flight, hotel and edited car with travel policy by booker
  As a corporate traveler (NL government) booking flight, hotel and car in parallel
  I want the travel policy to be determined by the primary passenger (booker)
  So that hotel and car options respect the booker's corporate travel policy

  Scenario: Parallel search flight, hotel and edited car applies the booker's travel policy
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step to search a flight with parallel hotel and an edited parallel car (create ParallelSearch.searchFlightHotelAndEditCar in src/dsl/ParallelSearch.js — Testim Search_flight_and_hotel_and_edit_car: flight LON->AMS, enable parallel hotel in Amsterdam, edit the parallel car destination to Madrid (MAD), select flight/car dates, then search)
    When I search for a flight to "AMS" with a parallel hotel and an edited car in "MAD"
    And I fill in NL reference fields education and courses
    # TODO: Create step to verify the flight origin and destination on the results header (create ParallelSearch.verifyFlightRoute in src/dsl/ParallelSearch.js)
    Then the flight origin should show "London (LON)"
    And the flight destination should show "Amsterdam  (AMS)"
    When I click edit search
    # TODO: Create step to verify the flight depart and return dates are retained in the edit search (create ParallelSearch.verifyFlightDatesRetained in src/dsl/ParallelSearch.js)
    Then the flight depart and return dates should match the entered dates
    # TODO: Create step to close the edit search drawer (create ParallelSearch.closeEditSearch in src/dsl/ParallelSearch.js)
    When I close the edit search drawer
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    # TODO: Create step to verify the parallel hotel results heading (create ParallelSearch.verifyHotelDestinationHeading in src/dsl/ParallelSearch.js)
    Then the parallel hotel results heading should be "Amsterdam hotel"
    # TODO: Create step to verify the travel policy applied to hotel results is the booker's policy (create ParallelSearch.verifyBookerTravelPolicy in src/dsl/ParallelSearch.js — Testim validate_policy: Distance filter visible, Payment section, and the tooltip "Hotel cost per night is greater than or equals 70 EUR")
    And the hotel travel policy should match the booker policy
    When I add a refundable room to my cart
    # TODO: Create step to verify the parallel car results heading (create ParallelSearch.verifyCarDestinationHeading in src/dsl/ParallelSearch.js)
    Then the parallel car results heading should be "Madrid car hire"
    And the parallel car location should be "Madrid,Spain,(MAD)"
    When I click edit search
    # TODO: Create step to verify the car pick-up and drop-off dates are retained in the edit search (create ParallelSearch.verifyCarDatesRetained in src/dsl/ParallelSearch.js)
    Then the car pick-up and drop-off dates should match the entered dates
