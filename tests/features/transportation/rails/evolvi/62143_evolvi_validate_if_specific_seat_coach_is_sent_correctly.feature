# Test Name: 62143 Evolvi - Validate if specific seat coach is sent correctly
# Description: Validate if specific seat coach is sent correctly
# Status: Active
# Labels: Rail,Evolvi,Expiry,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-16T06:00:16Z
# Updated: 2025-09-14T11:57:07Z
@transportation @rails @evolvi @regression @wip
Feature: 62143 Evolvi - Validate if specific seat coach is sent correctly
  As a corporate traveler booking a UK Rail journey with a reserved seat
  I want the coach returned for my specific seat reservation to be a valid single coach letter
  So that the seat and coach held with the supplier match what is shown on my booked quote

  Scenario: Specific seat reservation returns a valid coach on the booked UK Rail quote
    Given I am logged in as "corp@evolvi32.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "glcToEus"
    And I add an Evolvi one way to the trip
    Then the cart status should be Pending booking

    # TODO: open the UK Rail seat reservation row in the cart extras section
    When I open the UK Rail seat reservation in the cart extras
    # TODO: select the specific seat radio option in the seat reservation
    And I select the "Specific Seat" UK Rail seat option
    # TODO: fill the telephone field required by the specific seat reservation
    And I fill in the UK Rail seat reservation telephone number "912345678"
    # TODO: save the seat reservation and wait for the extras row to persist
    And I save the UK Rail seat reservation

    And I fill mandatory Evolvi fields in cart
    # TODO: open the UK Rail client reference extras row and fill every reference field, then save
    And I fill in the UK Rail client reference fields in cart
    And I click add payment method button
    And I select card 1 and save
    When I proceed to checkout
    And I wait for booking details in checkout
    # TODO: fill every mandatory reference field rendered on the checkout page with a valid value
    And I fill in all mandatory checkout reference fields
    And I complete the booking

    Then I should see route that contains "Glasgow Central" to "London Euston"
    # TODO: expand the seat details shown on the booked UK Rail quote summary
    When I open the UK Rail quote summary seat details
    # TODO: read the coach value from the quote summary seat details and assert it is a single uppercase letter
    Then the coach in the UK Rail quote summary should be a single uppercase letter
    When I click more details in cart
    And I successfully cancel the trip
