# Test Name: 22914 MERGED Parallel search flight with edited Car + reference and dynamic fields on search are taken from the primary traveler (booker) + best sorting explanation
# Description:
# Status: Active
# Labels: Parallel,Flights,Cars,Regression,No Amadeus Hotel Book,Dynamic fields,Reference Fields,NL government,Search Flight,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-21T11:33:53Z
# Updated: 2026-02-10T05:14:42Z

@regression @shell @parallel-search @flights @cars @dynamic-fields
Feature: 22914 Shell - Parallel search flight with edited car, booker reference fields and best sorting explanation
  As a corporate traveler (NL government) using parallel flight and car search
  I want the reference and dynamic fields to be taken from the primary traveler (booker) and to understand the best sorting
  So that the trip reflects the booker's fields and I can see why results are sorted as best

  Scenario: Parallel search flight with edited car validates booker reference fields and best sorting explanation
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step to search a flight with an edited parallel car (create ParallelSearch.searchFlightAndEditCar in src/dsl/ParallelSearch.js — Testim Search_flight_and_edit_car: flight LON->TLV, edit the parallel car destination to Madrid (MAD), select flight/car dates, then search)
    When I search for a flight to "TLV" with an edited car in "MAD"
    # TODO: Create step to verify the dynamic and reference field labels taken from the booker (create DynamicAndReferenceFields.verifyBookerFieldLabels in src/dsl/DynamicAndReferenceFields.js — Testim validate_fields: "Soort reis/Type of trip", "Type of traveller", "Location travel policy", "Location")
    Then the booker reference field labels should be displayed
    # TODO: Create step to verify the dynamic and reference field default values taken from the booker (create DynamicAndReferenceFields.verifyBookerFieldValues in src/dsl/DynamicAndReferenceFields.js — Testim validate_content: "Select", "Caribbean", "Select")
    And the booker reference field values should be displayed
    # TODO: Create step to verify the non-editable reference fields (create DynamicAndReferenceFields.verifyNonEditableFields in src/dsl/DynamicAndReferenceFields.js — Testim validate_noneditable uses html-attr-validation and must be validated manually)
    And the non-editable reference fields should not be editable
    And clicking proceed should show a mandatory field validation error
    # TODO: Create step to fill the mandatory booker reference field and proceed to results (create DynamicAndReferenceFields.fillMandatoryFieldAndProceed in src/dsl/DynamicAndReferenceFields.js — Testim validate_can_proceed opens the trip-type dropdown, selects an option and proceeds until the Price filter is visible)
    When I fill the mandatory booker reference field and proceed
    # TODO: Create step to verify the flight origin and destination on the results header (create ParallelSearch.verifyFlightRoute in src/dsl/ParallelSearch.js)
    Then the flight origin should show "London (LON)"
    And the flight destination should show "Tel Aviv       (TLV)"
    When I click edit search
    # TODO: Create step to verify the flight depart and return dates are retained in the edit search (create ParallelSearch.verifyFlightDatesRetained in src/dsl/ParallelSearch.js)
    Then the flight depart and return dates should match the entered dates
    # TODO: Create step to close the edit search drawer (create ParallelSearch.closeEditSearch in src/dsl/ParallelSearch.js)
    When I close the edit search drawer
    # TODO: Create step to verify the best sorting explanation tooltip (create ParallelSearch.verifyBestSortingExplanation in src/dsl/ParallelSearch.js — Testim hovers .tooltip-img and asserts the "Best calculates the most suitable option..." tooltip text)
    Then the best sorting explanation tooltip should be displayed
    When I add the first flight to cart
    And I handle conflicting quotes if visible
    # TODO: Create step to verify the parallel car results heading (create ParallelSearch.verifyCarDestinationHeading in src/dsl/ParallelSearch.js)
    Then the parallel car results heading should contain "car hire"
    And the parallel car location should be "Madrid,Spain,(MAD)"
    When I click edit search
    # TODO: Create step to verify the car pick-up and drop-off dates are retained in the edit search (create ParallelSearch.verifyCarDatesRetained in src/dsl/ParallelSearch.js)
    Then the car pick-up and drop-off dates should match the entered dates
