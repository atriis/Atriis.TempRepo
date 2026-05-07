# Test Name: 69159 Lufthansa NDC - Flight - Booking flight selected from 'Pricing Options'
# Description:
# Status: Active
# Labels: Flights,Full Purchase,Pricing Options,Lufthansa NDC Regression,additional pricing options,NDC,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-21T04:50:35Z
# Updated: 2026-01-19T12:06:24Z

@regression @flights @ndc @lufthansa @pricing-options @full-purchase
Feature: 69159 Lufthansa NDC - Booking flight selected from pricing options

  As a corporate traveler
  I want to book a Lufthansa NDC flight selected from pricing options
  So that I can complete a booking using the pricing options flow

  Scenario: Book a Lufthansa NDC round trip flight from pricing options
    Given I am logged in as "clara" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "FRA" to "MUC"
    Then flight results should be available

    # Open pricing options and add flight from there
    When I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"

    # Accept T&C and proceed to checkout
    When I proceed to checkout

    # TODO: Implement step "I handle price change prompt if visible" — click accept on price change dialog if it appears (see Price_change_prompt in Testim: clicks on price change accept button)

    # Book and finalize
    When I complete the booking
