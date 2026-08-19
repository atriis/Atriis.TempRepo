# Test Name: 59032 Evolvi- validate lowest and greenest fares
# Description: validate display of greenest fare in results page and selection of this fare in cart page
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-03-03T03:05:42Z
# Updated: 2025-07-28T10:17:12Z
@transportation @rails @evolvi @regression @wip
Feature: 59032 Evolvi - validate lowest and greenest fares
  As a rail booker
  I want the greenest Evolvi fare to be flagged in the results page
  So that I can select it and see the same price carried into the cart

  Scenario: The greenest Evolvi fare is flagged in results and keeps its price in the cart
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "lonToLds"
    And I dismiss the mandatory notifications popup if displayed
    # TODO: hover the fare highlighted as the greenest (lowest carbon) option in the Evolvi results price grid so its tooltip opens
    And I hover over the greenest Evolvi fare in results
    # TODO: assert the tooltip opened over the greenest Evolvi fare reads the expected carbon-efficiency message
    Then the greenest fare tooltip should show "The lowest carbon-efficient fare available"
    # TODO: click the greenest (lowest carbon) fare amount in the Evolvi results price grid to select it
    When I select the greenest Evolvi fare
    # TODO: read the selected fare total shown in the Evolvi results header and store it as the last extracted price
    And I extract the selected fare total price from the Evolvi results header
    # TODO: click the add to trip button in the selected prices container to move the selected Evolvi fare into the cart
    And I add the selected Evolvi fare to the trip
    Then the cart total price should match the last extracted price
