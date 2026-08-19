# Test Name: 62141 Evolvi> The quotes are displayed correctly
# Description: The quotes are displayed correctly
# Status: Active
# Labels: Rail,Evolvi,Expiry,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-16T12:46:53Z
# Updated: 2025-09-14T11:55:57Z
@transportation @rails @evolvi @regression @wip
Feature: 62141 Evolvi - The quotes are displayed correctly
  As a corporate traveler
  I want to book a one way Evolvi UK Rail journey end to end
  So that the booked quote is displayed with the correct route before I cancel it

  Scenario: Booked Evolvi quote is displayed correctly in the trip overview and can be cancelled
    Given I am logged in as "corp@evolvi32.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "glcToEus"
    And I select the first available Evolvi fare
    And I wait for add to trip text to be visible
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    And I select default delivery method and save
    # TODO: open the UK Rail seats mandatory extras row, enter the mobile number in its number field and save the row - the generic mandatory Evolvi extras step only handles radio and dropdown rows
    And I add the Evolvi seat reservation extra with mobile number "912345678"
    And I fill mandatory Evolvi fields in cart
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: on the checkout page, continue past the booking details step and fill the three mandatory numeric checkout fields with the given values before finalizing
    And I fill the mandatory Evolvi checkout fields with "1234", "4321" and "2565"
    And I complete the booking
    # TODO: assert the booked Evolvi quote details panel (quote title and tabs) is displayed on the trip overview after booking
    Then the booked Evolvi quote details should be displayed in the trip overview
    And I should see route that contains "Glasgow Central" to "London Euston"
    And I successfully cancel the quote
    # TODO: assert the cancellation result line for the quote reads "Cancelled successfully" - the reuse cancel step closes the confirmation modal, so read it inside the cancel flow or assert the quote's Cancelled state on the trip overview
    And the quote should be cancelled successfully
