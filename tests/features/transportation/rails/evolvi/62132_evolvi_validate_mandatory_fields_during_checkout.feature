# Test Name: 62132 Evolvi> Validate mandatory fields during checkout
# Description: Validate mandatory fields
# Status: Active
# Labels: Rail,Evolvi,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-15T05:42:46Z
# Updated: 2025-09-17T12:04:43Z
@transportation @rails @evolvi @regression @wip
Feature: 62132 Evolvi - Validate mandatory fields during checkout
  As a rail booker
  I want the proceed to checkout button to stay disabled until every mandatory Evolvi extras field is filled
  So that a UK rail booking can never be sent to checkout with missing mandatory information

  Scenario: Delivery method, seating and reason for non lowest fare are mandatory before checkout
    Given I am logged in as "corp@evolvi32.com" booking a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    And I search for a one way Evolvi train from "182To115"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I click the proceed to checkout button
    Then the proceed to checkout button should be disabled
    And the "Delivery Method" section should be visible in the extras
    And the "Seating" section should be visible in the extras
    And the "Reason for Non Lowest" section should be visible in the extras
    When I select default delivery method and save
    Then the proceed to checkout button should be disabled
    # TODO: expand the Evolvi "Seating" extras row in the cart, enter the given mobile number in its number field and save the row
    When I fill the Evolvi seating extras with mobile number "9123456789" and save
    Then the proceed to checkout button should be disabled
    # TODO: expand the Evolvi "Reason for Non Lowest" extras row in the cart, pick the first option in its dropdown and save the row
    When I select the first reason for non lowest fare option and save
    Then the proceed to checkout button should be disabled
    When I accept Terms & Conditions
    Then the "Delivery Method" section should be visible in the extras
    And the "Seating" section should be visible in the extras
    And the "Reason for Non Lowest" section should be visible in the extras
    # TODO: assert the cart terms and conditions checkbox is in the checked state after accepting
    And the terms and conditions checkbox should be checked
    And the proceed to checkout button should be enabled
    When I click the proceed to checkout button once enabled

  Scenario: Client reference is mandatory before checkout in addition to the other Evolvi extras
    Given I am logged in as "eve@levi.com" booking a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    And I search for a one way Evolvi train from "182To115"
    And I close mandatory notifications if displayed
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I click the proceed to checkout button
    Then the proceed to checkout button should be disabled
    And the "Delivery Method" section should be visible in the extras
    And the "Seating" section should be visible in the extras
    And the "Reason for Non Lowest" section should be visible in the extras
    And the "Client Reference" section should be visible in the extras
    # TODO: assert the terms and conditions block is displayed on the Evolvi quote card in the cart
    And the terms and conditions section should be displayed for the Evolvi quote
    When I select default delivery method and save
    Then the proceed to checkout button should be disabled
    # TODO: expand the Evolvi "Seating" extras row in the cart, enter the given mobile number in its number field and save the row
    When I fill the Evolvi seating extras with mobile number "9123456789" and save
    Then the proceed to checkout button should be disabled
    # TODO: expand the Evolvi "Reason for Non Lowest" extras row in the cart, pick the first option in its dropdown and save the row
    When I select the first reason for non lowest fare option and save
    Then the proceed to checkout button should be disabled
    # TODO: expand the Evolvi "Client Reference" extras row in the cart, fill its two reference text fields with the given values and save the row
    When I fill the Evolvi client reference extras with "To" and "Test" and save
    Then the proceed to checkout button should be disabled
    When I accept Terms & Conditions
    Then the "Delivery Method" section should be visible in the extras
    And the "Seating" section should be visible in the extras
    And the "Reason for Non Lowest" section should be visible in the extras
    And the "Client Reference" section should be visible in the extras
    # TODO: assert the cart terms and conditions checkbox is in the checked state after accepting
    And the terms and conditions checkbox should be checked
    And the proceed to checkout button should be enabled
    When I click the proceed to checkout button once enabled
    # TODO: assert the checkout page has loaded after proceeding from the cart, by waiting for its primary action button to render
    Then the checkout page should be displayed after proceeding from the cart
