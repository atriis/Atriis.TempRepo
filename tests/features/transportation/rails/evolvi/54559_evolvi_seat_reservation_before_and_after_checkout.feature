# Test Name: 54559 Evolvi seat reservation before and after checkout
# Description: show offered seats in case user choose "specific seat" = any
# Status: Active
# Labels: No Amadeus Hotel Book,Full Purchase,Regression,Rail,Evolvi,progress page,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-11-21T01:08:29Z
# Updated: 2025-11-11T10:11:44Z
@transportation @rails @evolvi @regression @wip
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
    Then the quote destination should contain "UK Rail To Leeds"

    # TODO: open the UK Rail seat reservation row in the cart extras section
    When I open the UK Rail seat reservation in the cart extras
    # TODO: assert the seat reservation shows the default specific-seat value
    Then the UK Rail seat option should be "Any"
    # TODO: save the seat reservation and wait for the extras row to persist
    When I save the UK Rail seat reservation
    # TODO: reopen the UK Rail seat reservation row in the cart extras section
    And I open the UK Rail seat reservation in the cart extras
    # TODO: assert the saved seat option is now the specific seat option
    Then the UK Rail seat option should be "Specific Seat"
    # TODO: select the specific seat radio option in the seat reservation
    When I select the "Specific Seat" UK Rail seat option
    # TODO: read and store the seat number offered in the seat reservation
    And I extract the offered seat number from the UK Rail seat reservation
    # TODO: compare the reserved seat shown on the quote summary with the stored seat number
    Then the reserved seat in the UK Rail quote summary should match the extracted seat number
    # TODO: assert the quote summary shows the reserved seat label
    And the UK Rail quote summary should show "Reserved Seat:"

    # TODO: save the seat reservation and wait for the extras row to persist
    When I save the UK Rail seat reservation
    # TODO: reopen the UK Rail seat reservation row in the cart extras section
    And I open the UK Rail seat reservation in the cart extras
    # TODO: assert the saved seat option is still the specific seat option
    Then the UK Rail seat option should be "Specific Seat"
    # TODO: select the specific seat radio option in the seat reservation
    When I select the "Specific Seat" UK Rail seat option
    # TODO: read and store the seat number offered in the seat reservation
    And I extract the offered seat number from the UK Rail seat reservation
    # TODO: compare the reserved seat shown on the quote summary with the stored seat number
    Then the reserved seat in the UK Rail quote summary should match the extracted seat number
    # TODO: read and store the coach offered in the seat reservation
    When I extract the offered coach from the UK Rail seat reservation
    # TODO: assert the quote summary shows the stored coach value
    Then the UK Rail quote summary should show the extracted coach
    # TODO: save the seat reservation and wait for the extras row to persist
    When I save the UK Rail seat reservation

    And I fill mandatory Evolvi fields in cart
    # TODO: open the UK Rail client reference extras row and fill every reference field, then save
    And I fill in the UK Rail client reference fields in cart
    And I proceed to checkout
    And I complete the booking
    When I click more details in cart
    Then the more details should show "Seat: Coach:"
    And I close more details in cart
    When I click the share quote button
    Then the share quote preview should show "Seat: Coach:"
    And I close the share dialog
