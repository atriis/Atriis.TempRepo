# Test Name: 38312 MERGED transferz - booking + see "all types" +vehicle filter+ add ons
# Description:
# Status: Active
# Labels: Filters,No Amadeus Hotel Book,Full Purchase,Transferz Regression,progress page,Pre Prod,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-29T09:31:37Z
# Updated: 2025-09-29T02:44:58Z
# TODO: add USER_RAN_FERZ for ran@ferz.com before running this scenario.

@regression @transportation @ground_transport @provider:transferz @full_purchase
Feature: 38312 Transferz - Booking, filters, and add-ons

  As a corporate traveler
  I want to filter Transferz results and add extras before booking
  So that the selected vehicle and pricing remain consistent through checkout

  Scenario: Transferz booking supports vehicle filters, extras, and trip overview terms
    Given I am logged in as "ran@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "Brussels, Belgium - National (BRU)" to specific address "Rue de la Violette, Brussels, Belgium"
    And I handle conflicting quotes if visible
    Then ground transport results should be displayed
    When I expand vehicle filters if available
    Then the ground transport vehicle filter should be displayed
    When I filter ground transport results by vehicle type "Business limousine"
    Then ground transport results should match the vehicle filter "Business limousine"
    When I filter ground transport results by vehicle type "Minivan"
    And I remove the ground transport vehicle filter "Business limousine"
    Then ground transport results should match the vehicle filter "Minivan"
    When I add the first result to trip
    Then the ground transport more details link should be visible
    When I capture the ground transport total price
    And I add ground transport contact information
    And I add a ground transport extra
    And I capture the ground transport total price
    Then the ground transport total should include the selected extra
    When I proceed to checkout
    And I complete the booking
    Then the transfer booking status should be displayed
    When I open transfer terms and conditions from trip overview
    Then the transfer terms and conditions modal should be displayed
    And the transfer terms and conditions link should remain visible
    And I successfully cancel the trip
