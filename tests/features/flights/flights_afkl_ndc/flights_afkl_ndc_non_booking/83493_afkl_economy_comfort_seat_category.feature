# Test Name: 83493 AFKL - Economy Comfort is its own seat map category
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Seating,Seat Map,Economy Comfort
# Owner: Noam Miller

# ADO Test Case ID: 83493
# ADO workitem ID: 82538 (User Story)
# "Economy Comfort" is the PADIS EK characteristic, 38 in the FlightSeats response.
# Scope per product owner (work-item comment 2026-08-14): KLM-operated long-haul only.
@ado:83493 @regression @flights @afkl @ndc @seating @economy-comfort
Feature: 83493 AFKL - Economy Comfort is its own seat map category

  As a corporate traveler
  I want Economy Comfort seats to stand out in their own colour on the seat map
  So that I can pick a more comfortable economy seat at a glance

  Scenario: Economy Comfort seats are magenta and outrank preferred and extra legroom
    Given I am logged in as "afklcorp@regression.ams" booking a new trip
    And I have added myself as the traveler
    # AFKL returns no seat map at all for the default one-way offset, ~2 months out.
    When I search for a one way flight from "AMS" to "ORD" on the 2 "Tuesday" of next month
    Then flight results should be available
    When I filter results by carrier "KLM"
    And I click to open first pricing options
    And I select the pricing option containing "Standard"
    And I add to cart from pricing options page
    Then the booking status should be "Pending booking"
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load

    Then the economy comfort seats should be shown in the economy comfort color

    When I hover over an economy comfort seat
    Then the seat tooltip should contain the economy comfort label

    Then the economy comfort color should override the preferred and extra legroom colors

    And the seats without the economy comfort characteristic should keep their existing colors

    # The seat map drawer overlays the trip actions menu, so cancel cannot reach it.
    When I close the open drawer
    Then I successfully cancel the trip
