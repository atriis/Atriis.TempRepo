# Test Name: 40230 [Merge] Sabre - Cars -  "Pre-paid" or "Pay on departure" is being displayed on cart according with what it was displayed on search results page and dates in car request assistance are not pre populated
# Description:
# Status: Active
# Labels: merge,search,Regression,Cars,Request Assistance,Sabre,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-19T11:33:39Z
# Updated: 2025-07-30T03:29:56Z

@transportation @cars @regression @provider:sabre @ado:40230 @booking
Feature: 40230 - Sabre Cars - Prepaid or Pay on Departure Display

  Scenario: Is Prepaid = true on TMC agreement shows Pre paid on results and cart
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Enterprise" and 1 months ahead
    Then the payment type on results should be "Pre paid"
    When I add the first car to cart
    Then the payment type should be "Pre paid"

  Scenario: Is Prepaid = false with no billing number shows Pay On Departure on results and cart
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Hertz" and 1 months ahead
    Then the payment type on results should be "Pay On Departure"
    When I add the first car to cart
    Then the payment type should be "Pay On Departure"
