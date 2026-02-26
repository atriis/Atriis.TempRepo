# Test Name: 56841 Galileo - Hotel - Booking specific hotel
# Description: 
# Status: Active
# Labels: Galileo,Hotel,Regression,specific,Full Purchase,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-07-24T12:36:06Z
# Updated: 2025-11-14T05:24:19Z

@regression @provider:galileo
Feature: 56841 Galileo - Hotel booking with financial reference field in checkout
  As a corporate traveler using Galileo
  I want to fill in a financial reference field during checkout
  So that the booking is correctly coded for expense reporting

  @priority:high
  Scenario: Galileo hotel booking completes with reference field filled in checkout
    Given I am logged in as "galileo" "user_one" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "The Ritz-Carlton Dubai" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    # TODO: Create step "When I fill in the reference field in checkout" that calls DSL fillReferenceFieldInCheckout in Checkout.js
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

