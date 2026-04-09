# Test Name: 19197 [Merge] UK Parking - extras are displayed in cart, booking parking and PNR ID is displayed in the trip overview details
# Description:
# Status: Active
# Labels: UK Parking,Regression,performance,No Amadeus Hotel Book,merge,Full Purchase,progress page,Pre Prod,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-04T12:36:05Z
# Updated: 2025-10-30T08:08:04Z

@regression @transportation @parking @full_purchase
Feature: 19197 UK Parking - Extras and PNR in cart and trip overview

  As a corporate traveler
  I want to book UK airport parking with extras visible in the cart
  So that the parking PNR ID is displayed in the trip overview details after booking

  Scenario: Parking extras are displayed in cart and PNR ID is shown in trip overview after booking
    Given I am logged in as "priscila" booking a new trip
    And I have added myself as the traveler
    When I search for UK parking at "LHR"
    And I wait for add to trip text to be visible
    And I filter results by "Park and Ride" checkbox
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    When I fill in UK parking trip details with mobile "1234567890", car make "Tesla", model "Car", registration "ABC123", colour "Black", outbound flight "1234", terminal "3", return flight "6777" and return terminal "3"
    And I proceed to checkout
    And I complete the booking
    Then all quotes should have PNR codes
    And I successfully cancel the trip
