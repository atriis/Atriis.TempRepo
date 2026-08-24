# Test Name: 59032 Evolvi- validate lowest and greenest fares
# Description: validate display of greenest fare in results page and selection of this fare in cart page
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-03-03T03:05:42Z
# Updated: 2025-07-28T10:17:12Z
@transportation @rails @evolvi @regression
Feature: 59032 Evolvi - validate lowest and greenest fares
  As a rail booker
  I want the greenest Evolvi fare to be flagged in the results page
  So that I can select it and see the same price carried into the cart

  Scenario: The greenest Evolvi fare is flagged in results and keeps its price in the cart
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "lonToLds"
    And I acknowledge the push notification
    And I hover over the greenest Evolvi fare in results
    Then the greenest fare tooltip should show "The lowest carbon-efficient fare available"
    When I select the greenest Evolvi fare
    And I extract the selected fare total price from the Evolvi results header
    And I click Evolvi add to trip
    And the booking status should be "Pending booking"
    Then the cart total price should match the last extracted price
