# Test Name: 44941 [Merge] Benerail Moove - Journey details time match results page and pax does not go missing once adding quote to cart
# Description:
# Status: Active
# Labels: Rail,Keeps failing,Benerail Moove Regression,Bene seats,merge,results,Cart,Adding Passengers,Transportation,2026 plan 1,02
# Owner: Bruna Santos
# Created: 2024-04-18T09:24:08Z
# Updated: 2025-11-06T02:29:36Z
@wip @transportation @rails @benerail @regression
Feature: 44941 Benerail - Journey details time matches results page and passenger not lost on add to cart
  As a corporate traveler
  I want the journey departure and arrival times shown in journey details to match the results page
  So that I can trust the time information and confirm my passenger remains in cart after adding

  Scenario: Journey details times match results page and passenger is visible in cart after adding
    Given I am logged in as "beny@benerail.com" booking a new trip
    And I have added myself as the traveler
    # TODO: note Search_benerail_by_place_one_way__direct_only_ uses direct-only filter
    # The existing step does not support direct-only — add TODO on DSL to add directOnly option
    When I search for a one way Benerail train from "bebmiToSchiphol"
    And I click proceed on the reference fields popup
    # TODO: create step "When I extract the departure and arrival times from the Benerail results" in benerail_results.steps.js
    # covers: Extract_times() — extracts leave/arrive times from first result row on results page
    When I extract the departure and arrival times from the Benerail results
    # TODO: create step "When I open journey details for the first Benerail result" in benerail_results.steps.js
    # covers: Click_JOURNEY_DETAILS() — clicks Journey Details button on first result
    When I open journey details for the first Benerail result
    # TODO: create step "When I extract the departure and arrival times from the journey details panel" in benerail_results.steps.js
    # covers: Extract_times_journey_details_in_results_page()
    When I extract the departure and arrival times from the journey details panel
    # TODO: create step "Then the journey details times should match the results page times" in benerail_results.steps.js
    # covers: Comparing_if_times_matches_in_results_page_and_journal_details(...)
    Then the journey details times should match the results page times
    # TODO: create step "When I close the Benerail journey details panel" in benerail_results.steps.js
    # covers: Close_journey_details()
    When I close the Benerail journey details panel
    When I add a Benerail one way to the trip
    # TODO: create step "Then the traveler should still be visible in the Benerail cart" in benerail_results.steps.js
    # covers: Verifying_that_passenger_is_displayed_in_cart()
    Then the traveler should still be visible in the Benerail cart
