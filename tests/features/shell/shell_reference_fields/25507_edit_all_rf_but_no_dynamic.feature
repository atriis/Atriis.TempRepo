# Test Name: 25507 Edit all RF but no Dynamic
# Description: Edit RF and DYN via overview
# Status: Active
# Labels: Reference Fields,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-02-16T01:33:00Z
# Updated: 2025-09-07T08:06:51Z

@shell @reference_fields @regression
Feature: 25507 - Edit all reference fields from the trip overview

  As a user with edit permissions
  I want to edit the reference fields of an existing trip from the trip overview
  So that I can update the reference information after booking

  Scenario: Edit and save the reference fields of an existing trip
    Given I am logged in as "can@edit.chk" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "FRA"
    And I click proceed button if visible
    And I filter results by carrier "Lufthansa"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I fill in the OOP justification text "abc"
    And I add a credit card as payment method
    And I proceed to checkout
    And I send booking for approval
    Then the booking status should be "On hold"
    When I open the trip reference form from the trip overview
    And I click edit on the reference fields popup
    Then the following reference fields should not be editable:
    | Show In Checkout Not Editable  |