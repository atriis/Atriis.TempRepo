# Test Name: HYBRID for 67014 Expiry - "Search again" on expired quote
# Description: Validate "Search Again" on expired quote
# Status: Active
# Labels: Regression,Rail,Evolvi,Expiry,hybrid,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-09-12T10:21:52Z
# Updated: 2026-01-06T12:25:48Z
@transportation @rails @evolvi @regression @hybrid @wip
Feature: 67014 HYBRID Evolvi - Search again on an expired quote
  As a corporate traveler
  I want an expired Evolvi quote to offer a Search again action
  So that I can re-run the original journey search instead of booking an expired fare

  Scenario: Search again on an expired Evolvi quote re-runs the original journey search
    Given I am logged in as "corp@Evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "182To115"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"

    # TODO: wait for the Evolvi timed quote countdown to run down to zero, polling the countdown text in the cart rather than sleeping a fixed interval, and fail if it never reaches zero within the quote TTL
    When I wait for the Evolvi quote expiry counter to reach zero
    # TODO: read the actual text of the Evolvi quote status/countdown area and assert it reads "Expired" - the live countdown and the expired state share the same container, so a presence-only check still passes after expiry
    Then the trip quote status text should be "Expired"
    And the Delete button should be displayed and the Search again button should be clickable
    # TODO: click the Search again action on the expired Evolvi quote and wait for the search to be re-submitted
    When I click the Search again button on the expired Evolvi quote
    # TODO: assert Evolvi results are returned again for the original journey - same origin, destination and travel date as the expired quote, read from the results header rather than from element presence
    Then the Evolvi search results should be displayed for the original journey
