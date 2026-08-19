# Test Name: 67004 Evolvi - Anytime Return - City pairs are correct in cart
# Description:
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-11T02:11:04Z
# Updated: 2026-01-06T10:20:41Z
@transportation @rails @evolvi @regression @wip
Feature: 67004 Evolvi - Anytime Return - City pairs are correct in cart
  As a corporate traveler
  I want to book a round trip Evolvi journey on an Anytime Return fare
  So that the cart shows the correct ticket type and city pairs for both segments

  Scenario: Anytime Return round trip shows the correct city pairs in cart
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "bthToPad"
    And I acknowledge the push notification
    # TODO: wait for the outbound results section and click the outbound price of the named fare group (Anytime Return) in the Evolvi price grid
    And I select the outbound "Anytime Return" Evolvi fare
    # TODO: wait for the inbound results section and click the select-time option of the named fare group (Anytime Return) in the Evolvi price grid
    And I select the inbound "Anytime Return" Evolvi fare
    # TODO: click Add to trip on the Evolvi results page for the outbound and inbound fares already selected, without selecting any fare itself
    And I add the selected Evolvi fares to the trip
    Then the cart status should be Pending booking
    # TODO: assert the ticket type shown in the segment footer of both the outbound and the inbound rail segment of the UK Rail quote in cart
    And both rail segments in cart should show the ticket type "Anytime Return"
    And I should see route that contains "Bath Spa (BTH)" to "London Paddington (PAD)"
