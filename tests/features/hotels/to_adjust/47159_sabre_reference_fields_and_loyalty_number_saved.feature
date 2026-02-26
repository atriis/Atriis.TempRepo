# Test Name: 47159 Sabre - Hotel - It is possible to save loyalty number with letters and numbers
# Description: 
# Status: Active
# Labels: Regression,Sabre,Hotel,Hotel loyalty number,GDS,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-04T08:57:09Z
# Updated: 2025-09-14T09:18:19Z

@regression @provider:sabre
Feature: 47159 Sabre - Reference fields required and loyalty number saved after booking
  As a corporate traveler using Sabre
  I want to fill in reference fields and save my loyalty number during checkout
  So that my booking is properly coded and loyalty points are tracked

  @priority:high
  Scenario: Reference fields are filled and loyalty number is saved to profile
    Given I am logged in as "sabre" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "MCO" for 1 night
    # TODO: Create step "When I fill in the reference fields" that calls DSL fillReferenceFields in Checkout.js
    When I filter results by "Sabre" checkbox
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "When I save my loyalty number {string} for hotel chain {string}" that calls DSL saveLoyaltyNumber in Trip.js

