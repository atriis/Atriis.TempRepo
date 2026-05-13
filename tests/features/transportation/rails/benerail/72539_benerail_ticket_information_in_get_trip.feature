# Test Name: 72539 Benerail - Ticket information in get trip
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation,Daily Transportation,Bug ticket,2026 plan 2
# Owner: pini harush
# Created: 2026-01-09T04:49:25Z
# Updated: 2026-02-11T05:26:17Z
@wip @transportation @rails @benerail @regression @api
Feature: 72539 Benerail - Ticket information in GetTrip API response
  As a QA engineer
  I want to validate that the Benerail GetTrip API response contains ticket information
  So that I can confirm ticket fields are correctly included in the trip object

  Scenario: Benerail ticket information is present in the GetTrip API response after booking
    Given I am logged in as "pini@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    When I add a Benerail round trip to the trip
    When I proceed to checkout
    When I complete the booking
    # TODO: create step "When I extract the trip number from the current URL" in trips.steps.js
    # covers: getUrlTripNumber__add_tab_context_() — extracts trip ID from URL and opens a new tab context
    When I extract the trip number from the current URL
    # TODO: create step "Then the Benerail GetTrip API should contain ticket information" in benerail_results.steps.js
    # covers: API_Validation__GetTrip() — calls GetTrip API after booking and validates ticket fields present
    # NOTE: Original test waits 120 seconds (page.waitFor(120000)) for async processing before API call
    Then the Benerail GetTrip API should contain ticket information
    # TODO: create step "When I cancel the Benerail trip via API" in benerail_results.steps.js
    # covers: Cancel_trip_by_API('pini@bene.ral') — cancels the trip via API call after validation
    When I cancel the Benerail trip via API
