# Test Name: 62141 Evolvi> The quotes are displayed correctly
# Description: The quotes are displayed correctly
# Status: Active
# Labels: Rail,Evolvi,Expiry,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-16T12:46:53Z
# Updated: 2025-09-14T11:55:57Z
@transportation @rails @evolvi @regression
Feature: 62141 Evolvi - The quotes are displayed correctly
  As a corporate traveler
  I want to book a one way Evolvi UK Rail journey end to end
  So that the booked quote is displayed with the correct route

  Scenario: Booked Evolvi quote is displayed correctly in the trip overview
    Given I am logged in as "corp@evolvi32.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "glcToEus"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "Cost Code" reference field with "1234"
    And I fill in the "Legal Entity" reference field with "4321"
    And I fill in the "Business Area" reference field with "2565"
    And I complete the booking
    Then I should see route that contains "Glasgow Central" to "London Euston"
