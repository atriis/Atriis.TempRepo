# Test Name: HYBRID for 49316 Showing all cancelled quotes in GTP
# Description:
# Status: Active
# Labels: Regression,Flights,Hotel,UI,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-08-01T03:04:11Z
# Updated: 2025-09-17T12:19:50Z

@regression @shell @flights @hotels @ui @approval
Feature: 49316 HYBRID Showing all cancelled quotes in GTP
  As a corporate traveler using GTP
  I want to book a flight and a hotel and then cancel the entire trip
  So that all cancelled quotes are visible in the trip overview after cancellation

  Scenario: Book a flight and hotel via approval flow then cancel the trip
    Given I am logged in as "victor@approvalflow.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "HND"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    And I add a credit card as payment method
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I send booking for approval
    And I wait for booking details in checkout
    And the quote destination should contain "Flight to"
    And I click to add a hotel to my trip from cart
    When I search for a hotel in "London, UK" for 1 night from the cart drawer
    And I select the first hotel result
    And I add a refundable room to my cart alongside an existing booked quote
    Then the booking status should be "On hold"
    And I proceed to checkout
    And I send booking for approval
    Then I successfully cancel the trip
