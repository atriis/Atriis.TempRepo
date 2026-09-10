# Test Name: 62143 Evolvi - Validate if specific seat coach is sent correctly
# Description: Validate if specific seat coach is sent correctly
# Status: Active
# Labels: Rail,Evolvi,Expiry,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-16T06:00:16Z
# Updated: 2025-09-14T11:57:07Z
@transportation @rails @evolvi @regression
Feature: 62143 Evolvi - Validate if specific seat coach is sent correctly
  As a corporate traveler booking a UK Rail journey with a reserved seat
  I want the coach returned for my specific seat reservation to be a valid single coach letter
  So that the seat and coach held with the supplier match what is shown on my booked quote

  Scenario: Specific seat reservation returns a valid coach on the booked UK Rail quote
    Given I am logged in as "corp@evolvi32.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "glcToEus"
    And I add an Evolvi one way to the trip
    And the booking status should be "Pending booking"
    When I open the UK Rail seat reservation in the cart extras
    And I select the "Specific Seat" UK Rail seat option
    And I select the first available UK Rail coach
    And I fill in the UK Rail seat reservation telephone number "912345678"
    And I click the save button
    Then the coach sent in the UK Rail seat reservation should be a single uppercase letter
    When I fill in only the following Evolvi extras: "Delivery Method" and "Account / Child unit"
    And I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "Cost Code" reference field with "1234"
    And I fill in the "Legal Entity" reference field with "4321"
    And I fill in the "Business Area" reference field with "2565"
    And I complete the booking
    Then I should see route that contains "Glasgow Central" to "London Euston"
    When I click more details in cart
    Then the coach reserved seat in the UK Rail more details should be a single uppercase letter
    And I close more details in cart
