# Test Name: 67004 Evolvi - Anytime Return - City pairs are correct in cart
# Description:
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-11T02:11:04Z
# Updated: 2026-01-06T10:20:41Z
@transportation @rails @evolvi @regression
Feature: 67004 Evolvi - Anytime Return - City pairs are correct in cart
  As a corporate traveler
  I want to book a round trip Evolvi journey on an Anytime Return fare
  So that the cart shows the correct ticket type and city pairs for both segments

  Scenario: Anytime Return round trip shows the correct city pairs in cart
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "bthToPad"
    And I acknowledge the push notification
    And I select the outbound "Anytime Return" Evolvi fare
    And I select the inbound "Anytime Return" Evolvi fare
    And I click Evolvi add to trip
    And the booking status should be "Pending booking"
    And both rail segments in cart should show the ticket type "Anytime Return"
    And I should see route that contains "Bath Spa (BTH)" to "London Paddington (PAD)"
