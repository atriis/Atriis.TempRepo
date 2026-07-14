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
    # TODO: implement step - search for a car at the given location (pick-up/drop-off dates + times)
    When I search for a car in "lhr"
    # TODO: implement step - verify the "New trip reference fields" dialog is displayed
    Then the "New trip reference fields" dialog is displayed
    When I click proceed on the reference fields popup
    # TODO: implement step - verify the car search results are displayed (Price filter)
    Then the car search results are displayed
    # TODO: implement step - add the first car in the results list to the trip
    When I add the first car to cart
    When I handle conflicting quotes if visible
    # TODO: implement step - verify the trip overview is displayed
    Then the trip overview is displayed
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: implement step - verify the checkout reference field label is displayed
    Then the reference field "Checkout rf" is displayed
    # TODO: implement step - verify the checkout passenger-related reference field label is displayed
    And the reference field "Checkout Passenger Related" is displayed
