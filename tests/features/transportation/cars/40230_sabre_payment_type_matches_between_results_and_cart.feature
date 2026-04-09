# Test Name: 40230 [Merge] Sabre - Cars -  "Pre-paid" or "Pay on departure" is being displayed on cart according with what it was displayed on search results page and dates in car request assistance are not pre populated
# Description:
# Status: Active
# Labels: merge,search,Regression,Cars,Request Assistance,Sabre,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-19T11:33:39Z
# Updated: 2025-07-30T03:29:56Z
@regression @cars @provider:sabre
Feature: 40230 Sabre car payment type matches between results and cart
  As a corporate traveler
  I want payment type consistency across results and cart
  So that Sabre car FOP display remains reliable

  @priority:high
  Scenario: Capture the payment type on results and verify it stays the same in cart
    Given I am logged in as "robsoncruz" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I capture the current car FOP on results
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    And the current car FOP should be shown on cart
    # TODO: Map Testim step Click_to_start_new_trip() to an existing or new reusable cart action.
    # TODO: Map Testim step Travel_request_flow() and preserve its request-assistance date validations.
