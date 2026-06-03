# Test Name: 42082 [Merge] Date is not "Thursday, January 01" on cart page and "Cancellation confirmed!" is spelled correctly
# Description:
# Status: Active
# Labels: date,Regression,Cars,merge,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-01T10:58:33Z
# Updated: 2025-06-08T07:22:15Z

@regression @shell @transportation @cars
Feature: 42082 - Date is not "Thursday, January 01" on cart page and "Cancellation confirmed!" is spelled correctly
  As a corporate traveler booking a car
  I want the car pickup date shown in the cart to never display "Thursday, January 01"
  So that I can trust the displayed date is correct and the cancellation confirmation message is spelled correctly

  Scenario: Car date in cart is not "Thursday, January 01" and cancellation confirmation is spelled correctly
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I add the first car to cart
    # TODO: Extract the car date text displayed in the cart tabs container and assert it is not "Thursday, January 01"
    #       Proposed step: Then the car date in cart should not be "Thursday, January 01"
    #       DSL method: Cart.verifyCarDateIsNotJanuary01(page) — reads text from ".tabs-container [class^='mb'], [class*=' mb']" and throws if value equals "Thursday, January 01"
    Then I successfully cancel the trip
