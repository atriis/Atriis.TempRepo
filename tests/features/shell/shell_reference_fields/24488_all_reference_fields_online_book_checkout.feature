# Test Name: 24488 All Reference fields online book checkout
# Description: Check all Reference fields in request assistance stage
# Status: Active
# Labels: Reference Fields,Regression,No Amadeus Hotel Book,never failed,2026 plan 1
# Owner: pini harush
# Created: 2023-02-12T02:21:21Z
# Updated: 2024-09-24T10:33:31Z

@shell @reference_fields @regression @checkout
Feature: 24488 - All reference fields at the checkout stage during online booking

  As a booker completing a car booking online
  I want the configured reference fields to appear at the new-trip and checkout stages
  So that I can supply the required information before checkout

  Scenario: Reference fields are displayed at the new-trip and checkout stages for a car booking
    Given I am logged in as "Rf@testim.nl" booking a new trip
    When I initiate a car search at "lhr"
    Then the reference fields popup should show the following labels:
    | New Trip Rf |
    And I click proceed on the reference fields popup
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I proceed to checkout 
    And I wait for booking details in checkout
    Then the following checkout reference fields should be visible:
    | Checkout rf |
    | Checkout Passenger Related |
