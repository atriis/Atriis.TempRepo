# Test Name: 62008 Benerail Moove - Ticket is refundable in itinerary after booking
# Description:
# Status: Active
# Labels: Rail,Benerail Moove Regression,Full Purchase,Share Itinerary,progress page,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-09T09:56:34Z
# Updated: 2026-01-21T09:41:06Z
@wip @transportation @rails @benerail @regression @priority:critical
Feature: 62008 Benerail - Ticket is refundable in itinerary after booking
  As a corporate traveler
  I want to see the refundable status on the Benerail ticket in the trip overview after booking
  So that I know I can cancel and receive a refund

  Scenario: Benerail refundable ticket status is shown in itinerary after booking
    Given I am logged in as "beny" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "debhfToBebmi"
    And I click proceed on the reference fields popup
    When I select the first Benerail option
    # TODO: create step "Then the Benerail route displayed should be the correct one" in benerail_results.steps.js
    # covers: Checking_if_the_route_is_the_correct_one() — verifies displayed route matches search criteria
    Then the Benerail route displayed should be the correct one
    When I add a Benerail one way to the trip
    # TODO: create step "Then the Benerail route in cart should be the correct one" in benerail_results.steps.js
    # covers: Checking_if_the_route_is_the_correct_one_1() — verifies route in cart
    Then the Benerail route in cart should be the correct one
    # TODO: create step "Then the Benerail ticket should be marked as refundable in cart" in benerail_results.steps.js
    # covers: Validating_ticket_is_refundable() — verifies refundable badge/label in cart
    Then the Benerail ticket should be marked as refundable in cart
    # TODO: create step "When I select a seat for the Benerail booking" in benerail_results.steps.js
    # covers: Seating_sellect() — opens seating and selects a seat
    When I select a seat for the Benerail booking
    When I proceed to checkout
    When I complete the booking
    # TODO: create step "Then the trip overview should show the journey details button" in results.steps.js or benerail_results.steps.js
    # covers: Rails___Trip_Overview___Wait_for__More_details__display()
    Then the trip overview should show the journey details button
    # TODO: create step "Then the Benerail ticket should be marked as refundable in the itinerary after booking" in benerail_results.steps.js
    # covers: Validating_that_ticket_is_refundable_in_itinerary_after_booking()
    Then the Benerail ticket should be marked as refundable in the itinerary after booking
