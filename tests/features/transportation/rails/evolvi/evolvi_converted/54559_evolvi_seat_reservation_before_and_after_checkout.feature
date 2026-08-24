# Test Name: 54559 Evolvi seat reservation before and after checkout
# Description: show offered seats in case user choose "specific seat" = any
# Status: Active
# Labels: No Amadeus Hotel Book,Full Purchase,Regression,Rail,Evolvi,progress page,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-11-21T01:08:29Z
# Updated: 2025-11-11T10:11:44Z
@transportation @rails @evolvi @regression 
Feature: 54559 Evolvi - Seat reservation before and after checkout
  As a corporate traveler booking a UK Rail journey
  I want the seat offered when I choose a specific seat to be reserved on my quote
  So that the same seat and coach are shown in the cart, after booking and in the shared email

  Scenario: Offered seat and coach stay consistent from cart through booking and share email
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "lonToLds"
    And I close mandatory notifications if displayed
    And I add an Evolvi one way to the trip
    And the booking status should be "Pending booking"
    When I open the UK Rail seat reservation in the cart extras
    Then the UK Rail seat option should be "Any"
    When I save the UK Rail seat reservation
    And I open the UK Rail seat reservation in the cart extras
    And I select the "Specific Seat" UK Rail seat option
    And I extract the offered seat number from the UK Rail seat reservation
    And the UK Rail quote summary should show "Reserved Seat:"
    Then the seat number reserved seat in the UK Rail seating extra should match the extracted seat number
    When I save the UK Rail seat reservation
    And I open the UK Rail seat reservation in the cart extras
    And I select the "Specific Seat" UK Rail seat option
    And I extract the offered seat number from the UK Rail seat reservation
    Then the seat number reserved seat in the UK Rail seating extra should match the extracted seat number
    When I extract the offered coach from the UK Rail seat reservation
    Then the UK Rail seating extra summary should show the extracted coach
    When I save the UK Rail seat reservation
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I complete the booking
    When I click more details in cart
    Then the more details should show "Seat: Coach:"
    And I close more details in cart
    When I click the share quote button
    Then the share quote preview should show "Seat: Coach:"
    And I close the share dialog
    And I successfully cancel the trip
