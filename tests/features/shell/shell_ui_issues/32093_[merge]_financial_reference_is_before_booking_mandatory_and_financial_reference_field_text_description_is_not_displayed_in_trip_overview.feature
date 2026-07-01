# Test Name: 32093 [Merge] Financial Reference is before booking mandatory and Financial Reference field text description is not displayed in trip overview
# Description:
# Status: Active
# Labels: Reference Fields,Financial Reference Code,Regression,No Amadeus Hotel Book,merge,progress page,Cancel by process,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-19T04:16:27Z
# Updated: 2026-01-19T07:33:16Z

@regression @shell @reference_fields @financial_reference @flights
Feature: 32093 - Financial Reference is mandatory before booking and its field description is displayed in trip overview

  As a travel arranger
  I want the Financial Reference to be mandatory before booking and its description shown in the trip overview
  So that bookings always carry a valid financial reference and the field is clearly identified after booking

  Scenario: Financial Reference is mandatory before booking and its description is shown in the trip overview
    Given I am logged in as "bsfinancialref@bsrf.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "TLV"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the financial reference modal title should be "Financial Reference"
    And I select the first available financial reference
    And I wait for booking details in checkout
    And "Contact details" should be displayed in the checkout page
    When I complete the booking
    And the quote destination should contain "Flight to"
    When I open the financial reference details from the trip overview
    Then the financial reference field in the trip overview should show "(Financial Ref)"