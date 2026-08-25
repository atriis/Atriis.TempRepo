# Test Name: 38312 MERGED transferz - booking + see "all types" +vehicle filter+ add ons
# Description:
# Status: Active
# Labels: Filters,No Amadeus Hotel Book,Full Purchase,Transferz Regression,progress page,Pre Prod,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-29T09:31:37Z
# Updated: 2025-09-29T02:44:58Z

@regression @transportation @ground_transport @provider:transferz @full_purchase
Feature: 38312 Transferz - Booking, filters, and add-ons

  As a corporate traveler
  I want to filter Transferz results and add extras before booking
  So that the selected vehicle and pricing remain consistent through checkout

  Scenario: Transferz booking supports vehicle filters, extras, and trip overview terms
    Given I am logged in as "betoribeiro@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "Brussels, Belgium - National (BRU)" to specific address "Rue de la Violette, Brussels, Belgium"
    And I wait for add to trip text to be visible
    And I filter ground transport results by vehicle type "Minibus"
    Then all the ground transport options on this page contain "Minibus" model text
    When I remove the ground transport vehicle filter "Minibus"
    And I filter ground transport results by vehicle type "Minivan"
    Then all the ground transport options on this page contain "Minivan" model text
    When I remove the ground transport vehicle filter "Minivan"
    When I add the first result to trip
    And the booking status should be "Pending booking"
    And I extract the ground transport total price
    And I fill ground transport contact details in cart
    And I add a ground transport free extra meet and greet
    And I extract the ground transport total price after adding free extra meet and greet
    Then ground transport current total price is equal to ground transport free extra meet and greet plus ground transport total price
    When I proceed to checkout
    And I complete the booking
    Then the cart terms and conditions should include "To access the full terms and conditions, please check"
    And I successfully cancel the trip
