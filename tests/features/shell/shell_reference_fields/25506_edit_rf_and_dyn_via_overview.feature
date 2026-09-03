# Test Name: 25506 Edit RF and DYN via overview
# Description: Edit RF and DYN via overview
# Status: Active
# Labels: Reference Fields,Regression,piniTest,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-02-16T01:33:00Z
# Updated: 2025-09-07T07:59:32Z

@shell @reference_fields @regression
Feature: 25506 - Edit reference and dynamic fields from the trip overview

  As a user with edit permissions
  I want to edit the reference and dynamic fields of an existing trip from the trip overview
  So that I can update a reference field value after booking

  Scenario: Edit a reference field value and save from the trip overview
    Given I am logged in as "can@edit.dyn" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "MIA"
    And I click proceed button if visible
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I add a credit card as payment method
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Finalising"
    When I open the trip reference form from the trip overview
    And I click edit on the reference fields popup
    When I fill "New Trip" reference field pop up with "ABC123"
    And I type "Option 1" in reference field "Search DYN" to select the first dropdown option
    And I click proceed button if visible
    Then I should see a success notification
